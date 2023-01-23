import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { build } from './src/app';

// eslint-disable-next-line
// exports.handler = async(event: APIGatewayProxyEvent, context: Context) => proxy(event, context)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const app = await build();
  const proxy = awsLambdaFastify(app);
  return await proxy(event, context);
};
