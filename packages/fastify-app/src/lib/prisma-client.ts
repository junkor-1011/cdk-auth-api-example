import { z } from 'zod';
import { type Prisma, PrismaClient } from '@prisma/client';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsSchema = z.object({
  dbClusterIdentifier: z.string(),
  password: z.string(),
  engine: z.string().default('postgres'),
  port: z.number().default(5432),
  host: z.string(),
  username: z.string(),
});

const genDataSource = async (): Promise<Prisma.Datasource> => {
  if (process.env.STAGE === 'LOCAL') {
    return {
      url: process.env.DATABASE_URL,
    };
  }

  const client = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRETS_NAME,
  });
  const result = await client.send(command);
  const secrets = secretsSchema.parse(JSON.parse(result.SecretString ?? ''));
  const { username, password, host, port } = secrets;

  const url = `postgresql://${username}:${password}@${host}:${port}/appdb?schema=public&connection_limit=1`;
  // console.log('[DEBUG]url: ', url);
  return { url };
};

const db = await genDataSource();

export const prisma = new PrismaClient({
  log: ['info', 'warn', 'error', 'query'],
  datasources: {
    db,
  },
});
