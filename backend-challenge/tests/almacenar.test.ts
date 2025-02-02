import { defineFeature, loadFeature } from 'jest-cucumber';
import { almacenar } from '../src/handler';
import { APIGatewayEvent } from 'aws-lambda';
import * as AWS from 'aws-sdk';


jest.mock('aws-sdk');

const feature = loadFeature('./tests/features/almacenar.feature');

defineFeature(feature, (test) => {
  const mockDynamoDb = new AWS.DynamoDB.DocumentClient() as jest.Mocked<AWS.DynamoDB.DocumentClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Almacenar un nuevo dato', ({ given, when, then, and }) => {
    given('que envío una solicitud con datos personalizados', async () => {});

    when('el servidor recibe la solicitud', async () => {
      mockDynamoDb.put = jest.fn().mockReturnValue({ promise: async () => ({}) });
    });

    then('el sistema almacena la información en la base de datos', async () => {
      const response = await almacenar({
        body: JSON.stringify({ nombre: 'Ejemplo' }),
      } as APIGatewayEvent);

      expect(response.statusCode).toBe(201);
    });

    and('responde con un código 201 y un mensaje de éxito', async () => {
      const response = await almacenar({
        body: JSON.stringify({ nombre: 'Ejemplo' }),
      } as APIGatewayEvent);
      expect(JSON.parse(response.body)).toEqual({ message: 'Data stored successfully' });
    });
  });
});
