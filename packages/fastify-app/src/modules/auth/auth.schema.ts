import { z } from 'zod';

export const schemaOfAuthenticateRequest = z.object({
  username: z.string().describe('username'),
  password: z.string().describe('password'),
});
export type TAuthenticateRequest = z.infer<typeof schemaOfAuthenticateRequest>;

export const schemaOfCreateUserRequest = z.object({
  username: z.string().describe('username'),
  password: z.string().describe('password'),
});
export type TCreateUserRequest = z.infer<typeof schemaOfCreateUserRequest>;
