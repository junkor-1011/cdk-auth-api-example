import { type Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

await prisma.$transaction([prisma.user.deleteMany()]);
