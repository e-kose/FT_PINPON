export const requestParamsSchema = {
  params: {
    type: 'object',
    properties: { id: { type: 'number' } },
    required: ['id'],
  },
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  response: {
    200: { type: 'object', properties: { success: { type: 'boolean' } } },
    400: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
  },
};
