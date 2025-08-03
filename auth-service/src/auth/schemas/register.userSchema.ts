export const registerUserSchema = {
  type: 'object',
  required: ['username', 'password', 'email'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 254,
    },
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 32,
      pattern: '^[a-zA-Z0-9_]+$',
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 64,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
    },
  }
};
