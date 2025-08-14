import createError from "@fastify/error";

export const InvalidCredentials = createError(
  'INVALID_CREDENTIALS',
  'Wrong mail or credentials',
  401
);

export const InvalidToken = createError(
  'INVALID_TOKEN',
  'Token is invalid or deleted',
  401
);

export const twoFacNotInit= createError(
  '2FA not initialized',
  '2FA not initialized',
  400
);
