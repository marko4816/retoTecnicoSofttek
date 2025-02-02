import { defineFeature, loadFeature } from 'jest-cucumber';
import { historial } from '../src/handler';
import * as AWS from 'aws-sdk';

jest.mock('aws-sdk');

const feature = loadFeature('./tests/features/historial.feature');

defineFeature(feature, (test) => {
  const mockDynamoDb = new AWS.DynamoDB.DocumentClient() as jest.Mocked<AWS.DynamoDB.DocumentClient>;


  test('Obtener historial exitosamente', ({ given, when, then }) => {
    given('que existen registros en la base de datos', async () => {
      mockDynamoDb.scan = jest.fn().mockReturnValue({ promise: async () => ({ Items: [{ id: '1', data: 'Ejemplo' }] }) });
    });

    when('solicito el historial', async () => {});

    then('el sistema devuelve una lista de registros', async () => {
      const response = await historial();
      expect(JSON.parse(response.body)).toEqual([{ id: '1', data: 'Ejemplo' }]);
    });
  });
});
