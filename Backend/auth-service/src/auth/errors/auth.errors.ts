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

export const InvalidTwoFacToken = createError(
  'INVALID_2FA_TOKEN',
  '2FA_Token is invalid',
  401
);

export const twoFacNotInit= createError(
  '2FA not initialized',
  '2FA not initialized',
  400
);

export const RequiredToken = createError(
   'REQUIRED_2FA_TOKEN',
  '2FA token is required',
  401
);

export const Forbidden = createError (
  'FORBIDDEN',
  'Forbidden',
  403
)

export const AuthDataNotFound = createError(
  'AUTH_DATA_NOT_FOUND',
  'Auth data not found',
  404
);