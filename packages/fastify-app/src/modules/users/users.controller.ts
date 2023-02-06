import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '$api/lib/prisma-client.js';

export const getUsersHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    await reply.code(200).send({
      data: users,
    });
  } catch (err) {
    request.log.error(err);
    reply.internalServerError();
  }
};
