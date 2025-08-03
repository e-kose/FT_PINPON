import createError from "@fastify/error";

export const UserAlreadyExists = createError(
  'USER_ALREADY_EXISTS',
  'User with this email already exists',
  409
);