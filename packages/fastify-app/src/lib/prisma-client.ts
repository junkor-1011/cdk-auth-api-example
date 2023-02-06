import { type Prisma, PrismaClient } from '@prisma/client';

const dataSource = {
  url: process.env.DATABASE_URL,
} as const satisfies Prisma.Datasource;

export const prisma = new PrismaClient({
  log: ['info', 'warn', 'error', 'query'],
  datasources: {
    db: dataSource,
  },
});
