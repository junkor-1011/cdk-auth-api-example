/* eslint-disable @typescript-eslint/require-await */

import { type FastifyInstance } from 'fastify';
import { greetHandler } from './greet.controller';

const greetRoute = async (server: FastifyInstance): Promise<void> => {
  server.get('/', {
    handler: greetHandler,
  });
};
export default greetRoute;
