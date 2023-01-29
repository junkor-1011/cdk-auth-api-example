import type { FastifyReply, FastifyRequest } from 'fastify';

export const greetHandler = async (
  request: FastifyRequest<{ Headers: { authorization?: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  if (request.headers.authorization === undefined) {
    request.log.error('Theis no headers');
    request.log.error(request);
    reply.internalServerError();
    return;
  }
  try {
    const jwt = request.headers.authorization;

    const encoded = jwt.split('.').at(1);
    if (encoded === undefined) {
      request.log.error(jwt);
      throw new Error('jwt format error');
    }
    const decoded = Buffer.from(encoded, 'base64').toString();

    const payload = {
      message: 'hello,',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtPayloads: JSON.parse(decoded) ?? {},
    };
    await reply.code(200).send(payload);
  } catch (err) {
    request.log.error(err);
    reply.internalServerError();
  }
};
