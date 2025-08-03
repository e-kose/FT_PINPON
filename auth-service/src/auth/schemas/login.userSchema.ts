export const loginUserSchema = {
  type: 'object',
  required: ['password'],
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 254,
    },
    username: {
      type: 'string',
    },
    password: {
      type: 'string',
      minLength: 6,
      maxLength: 64,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
    },
  },
  anyOf: [
    { required: ['email'] },
    { required: ['username'] }
  ]
};
