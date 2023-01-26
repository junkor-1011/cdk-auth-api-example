/* eslint-disable @typescript-eslint/require-await */

import { type FastifyInstance } from 'fastify';
import { createUserHandler, authenticateHandler } from './auth.controller';

const authRoutes = async (server: FastifyInstance): Promise<void> => {
  server.post('/create-user', {
    handler: createUserHandler,
  });
  server.post('/authenticate', {
    handler: authenticateHandler,
  });
};
export default authRoutes;
