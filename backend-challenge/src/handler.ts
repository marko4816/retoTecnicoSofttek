import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import * as AWS from 'aws-sdk';


const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cacheTtl = 30 * 60 * 1000; 


const getExternalData = async () => {
  const starWarsApi = 'https://swapi.dev/api/people/';
  const weatherApi = 'https://api.openweathermap.org/data/2.5/weather?lat=44.34&lon=10.99&appid=ea87d91d4b5c2817fdeb06bcdce76036';

  const starWarsData = await axios.get(starWarsApi);
  const weatherData = await axios.get(weatherApi)

  return { starWarsData: starWarsData.data, weatherData: weatherData.data };
};


export const fusionados = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    
    const cachedData = await dynamoDb
      .get({
        TableName: 'Fusionados',
        Key: { id: 'fusionadosData' },
      })
      .promise();

    if (cachedData.Item && Date.now() - cachedData.Item.timestamp < cacheTtl) {
      return {
        statusCode: 200,
        body: JSON.stringify(cachedData.Item.data),
      };
    }


    const { starWarsData, weatherData } = await getExternalData();


    const fusionadosData = starWarsData.results.map((person: any) => ({
      name: person.name,
      planet: person.homeworld,
      weather: weatherData.weather[0].description,
    }));


    await dynamoDb
      .put({
        TableName: 'Fusionados',
        Item: {
          id: 'fusionadosData',
          data: fusionadosData,
          timestamp: Date.now(),
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(fusionadosData),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};


export const almacenar = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const requestBody = JSON.parse(event.body || '{}');

  try {

    await dynamoDb
      .put({
        TableName: 'Fusionados',
        Item: {
          id: `custom_${Date.now()}`,
          data: requestBody,
          timestamp: Date.now(),
        },
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Data stored successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};


export const historial = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {

    const result = await dynamoDb
      .scan({
        TableName: 'Fusionados',
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
