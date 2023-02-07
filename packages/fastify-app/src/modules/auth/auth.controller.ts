import { createHmac } from 'crypto';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AuthFlowType,
  UserNotFoundException,
  AdminSetUserPasswordCommand,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  schemaOfCreateUserRequest,
  type TCreateUserRequest,
  schemaOfAuthenticateRequest,
  type TAuthenticateRequest,
} from './auth.schema.js';
import { prisma } from '$api/lib/prisma-client.js';

function calculateSecretHash(username: string, clientId: string, clientSecret: string): string {
  const hasher = createHmac('sha256', clientSecret);
  hasher.update(`${username}${clientId}`);

  const secretHash = hasher.digest('base64');
  return secretHash;
}

export const createUserHandler = async (
  request: FastifyRequest<{ Body: TCreateUserRequest }>,
  reply: FastifyReply,
): Promise<void> => {
  request.log.info(`Authorization Header: ${request.headers.authorization ?? ''}`);

  try {
    const { username, password, message, role } = schemaOfCreateUserRequest.parse(request.body);

    const client = new CognitoIdentityProviderClient({});
    const command = new AdminCreateUserCommand({
      UserPoolId: process.env.USERPOOL_ID ?? '',
      Username: username,
      TemporaryPassword: password,
    });
    const createResult = await client.send(command);
    request.log.info(createResult);

    const commandForPasswordChange = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USERPOOL_ID ?? '',
      Username: username,
      Password: password,
      Permanent: true,
    });
    const result = await client.send(commandForPasswordChange);
    request.log.info(result);

    // register db
    const user = await prisma.user.create({
      data: {
        userid: username,
        message,
        role,
      },
    });

    await reply.code(201).send(user);
  } catch (err) {
    if (err instanceof ZodError) {
      request.log.info(err);
      reply.badRequest('request body is wrong.');
      return;
    }
    if (err instanceof UsernameExistsException) {
      request.log.info(err);
      reply.badRequest(err.message);
      return;
    }
    request.log.error(err);
    reply.internalServerError();
  }
};

export const authenticateHandler = async (
  request: FastifyRequest<{ Body: TAuthenticateRequest }>,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const { username, password } = schemaOfAuthenticateRequest.parse(request.body);

    const secretHash = calculateSecretHash(
      username,
      process.env.USERPOOL_CLIENT_ID ?? '',
      process.env.USERPOOL_CLIENT_SECRET ?? '',
    );

    const client = new CognitoIdentityProviderClient({});
    const command = new AdminInitiateAuthCommand({
      ClientId: process.env.USERPOOL_CLIENT_ID ?? '',
      UserPoolId: process.env.USERPOOL_ID ?? '',
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: { USERNAME: username, PASSWORD: password, SECRET_HASH: secretHash },
    });
    const result = await client.send(command);

    request.log.info(result);

    await reply.code(200).send(result.AuthenticationResult);
  } catch (err) {
    if (err instanceof ZodError) {
      request.log.info(err);
      reply.badRequest('request body is wrong.');
      return;
    }
    if (err instanceof UserNotFoundException) {
      request.log.info(err);
      reply.badRequest('User Not Found.');
      return;
    }
    request.log.error(err);
    reply.internalServerError();
  }
};
