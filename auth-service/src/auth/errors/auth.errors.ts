import createError from "@fastify/error";


export const InvalidToken = createError(
  'INVALID_TOKEN',
  'Token is invalid or deleted',
  401
);
