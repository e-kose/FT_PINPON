import createError from "@fastify/error";

export const InvalidCredentials = createError(
  'INVALID_CREDENTIALS',
  'Wrong mail/username or credentials',
  401
);

export const InvalidToken = createError(
  'INVALID_TOKEN',
  '2FA token is required',
  401
);

export const twoFacNotInit= createError(
  '2FA not initialized',
  '2FA not initialized',
  400
);


export const Forbidden = createError (
  'FORBIDDEN',
  'Forbidden',
  403
)