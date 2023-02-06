import { type Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const usersData = [
  {
    userid: 'hyper-user',
    message: 'super message',
  },
] satisfies Prisma.UserCreateManyInput[];

await prisma.$transaction([
  prisma.user.createMany({
    data: usersData,
    skipDuplicates: true,
  }),
]);
