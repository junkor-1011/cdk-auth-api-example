import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  schemaOfCreateUserRequest,
  type TCreateUserRequest,
  // TAuthenticateRequest,
} from './auth.schema';

export const createUserHandler = async (
  request: FastifyRequest<{ Body: TCreateUserRequest }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const { username, password } = schemaOfCreateUserRequest.parse(request.body);

    const client = new CognitoIdentityProviderClient({});
    const command = new AdminCreateUserCommand({
      UserPoolId: process.env.USERPOOL_ID ?? '', // TODO
      Username: username,
      TemporaryPassword: password,
    });
    const result = await client.send(command);
    await reply.code(201).send(result);
  } catch (err) {
    request.log.error(err);
    reply.internalServerError();
  }
};
