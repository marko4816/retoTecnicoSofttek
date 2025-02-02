"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historial = exports.almacenar = exports.fusionados = void 0;
const axios_1 = require("axios");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
});
const dynamoDb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const cacheTtl = 30 * 60 * 1000;
const getExternalData = async () => {
    try {
        const starWarsApi = 'https://swapi.dev/api/people/';
        const weatherApi = 'https://api.openweathermap.org/data/2.5/weather?lat=44.34&lon=10.99&appid=ea87d91d4b5c2817fdeb06bcdce76036';
        const [starWarsResponse, weatherResponse] = await Promise.all([
            axios_1.default.get(starWarsApi),
            axios_1.default.get(weatherApi),
        ]);
        return {
            starWarsData: starWarsResponse.data,
            weatherData: weatherResponse.data,
        };
    }
    catch (error) {
        console.error('Error al obtener datos externos:', error);
        throw new Error('Error al obtener datos externos');
    }
};
const fusionados = async () => {
    try {
        const cachedData = await dynamoDb.send(new lib_dynamodb_1.GetCommand({ TableName: 'Fusionados', Key: { id: 'fusionadosData' } }));
        if (cachedData.Item && Date.now() - cachedData.Item.timestamp < cacheTtl) {
            return {
                statusCode: 200,
                body: JSON.stringify(cachedData.Item.data),
            };
        }
        const { starWarsData, weatherData } = await getExternalData();
        const fusionadosData = starWarsData.results.map((person) => ({
            name: person.name,
            planet: person.homeworld,
            weather: weatherData.weather[0].description,
        }));
        await dynamoDb.send(new lib_dynamodb_1.PutCommand({
            TableName: 'Fusionados',
            Item: {
                id: 'fusionadosData',
                data: fusionadosData,
                timestamp: Date.now(),
            },
        }));
        return {
            statusCode: 200,
            body: JSON.stringify(fusionadosData),
        };
    }
    catch (error) {
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
exports.fusionados = fusionados;
const almacenar = async (event) => {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        await dynamoDb.send(new lib_dynamodb_1.PutCommand({
            TableName: 'Fusionados',
            Item: {
                id: `custom_${Date.now()}`,
                data: requestBody,
                timestamp: Date.now(),
            },
        }));
        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Data stored successfully' }),
        };
    }
    catch (error) {
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
exports.almacenar = almacenar;
const historial = async () => {
    try {
        const result = await dynamoDb.send(new lib_dynamodb_1.ScanCommand({ TableName: 'Fusionados' }));
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items || []),
        };
    }
    catch (error) {
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
exports.historial = historial;
//# sourceMappingURL=handler.js.map