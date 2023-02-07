import { z } from 'zod';

export const schemaOfAuthenticateRequest = z.object({
  username: z.string().describe('username'),
  password: z.string().describe('password'),
});
export type TAuthenticateRequest = z.infer<typeof schemaOfAuthenticateRequest>;

export const schemaOfCreateUserRequest = z.object({
  username: z.string().describe('username'),
  password: z.string().describe('password'),
  message: z.string().max(32).optional().describe('message'),
  role: z.enum(['ADMIN', 'USER']).optional().describe('role of user'),
});
export type TCreateUserRequest = z.infer<typeof schemaOfCreateUserRequest>;
