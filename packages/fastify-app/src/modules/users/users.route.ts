/* eslint-disable @typescript-eslint/require-await */

import { type FastifyInstance } from 'fastify';
import { getUsersHandler } from './users.controller.js';

const usersRoute = async (server: FastifyInstance): Promise<void> => {
  server.get('/', {
    handler: getUsersHandler,
  });
};
export default usersRoute;
