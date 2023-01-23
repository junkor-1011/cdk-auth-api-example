import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { build } from './src/app';

// TODO: generate db client out of Lambda Handler.

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const app = await build();
  const proxy = awsLambdaFastify(app);
  return await proxy(event, context);
};
