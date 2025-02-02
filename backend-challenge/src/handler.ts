import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const dynamoDb = DynamoDBDocumentClient.from(client);
const cacheTtl = 30 * 60 * 1000;

const getExternalData = async () => {
  try {
    const starWarsApi = 'https://swapi.dev/api/people/';
    const weatherApi = 'https://api.openweathermap.org/data/2.5/weather?lat=44.34&lon=10.99&appid=ea87d91d4b5c2817fdeb06bcdce76036';

    const [starWarsResponse, weatherResponse] = await Promise.all([
      axios.get(starWarsApi),
      axios.get(weatherApi),
    ]);

    return {
      starWarsData: starWarsResponse.data,
      weatherData: weatherResponse.data,
    };
  } catch (error) {
    console.error('Error al obtener datos externos:', error);
    throw new Error('Error al obtener datos externos');
  }
};

export const fusionados = async (): Promise<APIGatewayProxyResult> => {
  try {
    
    const cachedData = await dynamoDb.send(
      new GetCommand({ TableName: 'Fusionados', Key: { id: 'fusionadosData' } })
    );

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

    
    await dynamoDb.send(
      new PutCommand({
        TableName: 'Fusionados',
        Item: {
          id: 'fusionadosData',
          data: fusionadosData,
          timestamp: Date.now(),
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(fusionadosData),
    };
  } catch (error) {
    console.error('Error en fusionados:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const almacenar = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const requestBody = JSON.parse(event.body || '{}');

    
    await dynamoDb.send(
      new PutCommand({
        TableName: 'Fusionados',
        Item: {
          id: `custom_${Date.now()}`,
          data: requestBody,
          timestamp: Date.now(),
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Data stored successfully' }),
    };
  } catch (error) {
    console.error('Error en almacenar:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const historial = async (): Promise<APIGatewayProxyResult> => {
  try {
    
    const result = await dynamoDb.send(new ScanCommand({ TableName: 'Fusionados' }));

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    console.error('Error en historial:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
