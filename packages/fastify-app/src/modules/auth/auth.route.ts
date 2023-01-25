/* eslint-disable @typescript-eslint/require-await */

import { type FastifyInstance } from 'fastify';
import { createUserHandler } from './auth.controller';

const authRoutes = async (server: FastifyInstance): Promise<void> => {
  server.post('create-user', {
    handler: createUserHandler,
  });
};
export default authRoutes;
