export const sentRequestsSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              friend_id: { type: 'number' },
              friend_username: { type: 'string' },
              email: { type: ['string', 'null'] },
              friend_full_name: { type: 'string' },
              bio: { type: 'string' },
              friend_avatar_url: { type: ['string', 'null'] },
              status: { type: 'string' },
            },
          },
        },
      },
    },
    400: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
  },
};
