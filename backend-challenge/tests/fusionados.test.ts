import { defineFeature, loadFeature } from 'jest-cucumber';
import { fusionados } from '../src/handler';
import * as AWS from 'aws-sdk';
import axios from 'axios';

jest.mock('aws-sdk');
jest.mock('axios');

const feature = loadFeature('./tests/features/fusionados.feature');

defineFeature(feature, (test) => {
  const mockDynamoDb = new AWS.DynamoDB.DocumentClient() as jest.Mocked<AWS.DynamoDB.DocumentClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Obtener datos cuando no están en caché', ({ given, when, then, and }) => {
    given('que la caché está vacía', async () => {
      mockDynamoDb.get = jest.fn().mockReturnValue({
        promise: async () => ({ Item: null }),
      });
    });

    when('solicito la información fusionada', async () => {
      (axios.get as jest.Mock).mockImplementation((url) => {
        if (url.includes('swapi')) {
          return Promise.resolve({ data: { results: [{ name: 'Luke Skywalker', homeworld: 'Tatooine' }] } });
        } else {
          return Promise.resolve({ data: { weather: [{ description: 'Soleado' }] } });
        }
      });
    });

    then('el sistema consulta las APIs externas', async () => {
      const response = await fusionados();
      expect(response.statusCode).toBe(200);
    });

    and('devuelve una lista de personajes con datos del clima', async () => {
      const response = await fusionados();
      const body = JSON.parse(response.body);
      expect(body).toEqual([{ name: 'Luke Skywalker', planet: 'Tatooine', weather: 'Soleado' }]);
    });
  });

  test('Obtener datos cuando están en caché', ({ given, when, then }) => {
    given('que los datos ya están en caché', async () => {
      mockDynamoDb.get = jest.fn().mockReturnValue({
        promise: async () => ({
          Item: {
            id: 'fusionadosData',
            data: [{ name: 'Luke Skywalker', planet: 'Tatooine', weather: 'Soleado' }],
            timestamp: Date.now(),
          },
        }),
      });
    });

    when('solicito la información fusionada', async () => {
      const response = await fusionados();
      expect(response.statusCode).toBe(200);
    });

    then('el sistema devuelve los datos desde la caché', async () => {
      const response = await fusionados();
      const body = JSON.parse(response.body);
      expect(body).toEqual([{ name: 'Luke Skywalker', planet: 'Tatooine', weather: 'Soleado' }]);
    });
  });
});
