import createError from "@fastify/error";

export const UserAlreadyExistsEmail = createError(
  'USER_ALREADY_EXISTS',
  'User with this email already exists',
  409
);

export const UserAlreadyExistsUsername = createError(
  'USER_ALREADY_EXISTS',
  'User with this username already exists',
  409
);


export const UserNotFound = createError(
  'USER_NOT_FOUND',
  'User not found',
  404
);

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

export const Forbidden = createError (
  'FORBIDDEN',
  'Forbidden',
  403
)

export const BadRequest = createError(
  'BAD_REQUEST',
  'Bad request',
  400
);