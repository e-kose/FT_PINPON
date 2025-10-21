export const listFriendsSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  response: {
    200: {
      description: 'List of friends envelope',
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        friends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              friend_id: { type: 'number' },
              friend_username: { type: 'string' },
              friend_email: { type: 'string' },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request / missing header',
      type: 'object',
      properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } },
    },
  },
};

export const listRequestsSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  response: {
    200: {
      description: 'List of friend requests envelope',
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        requests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              user_id: { type: 'number' },
              friend_id: { type: 'number' },
              status: { type: 'string' },
              requester_username: { type: 'string' },
              requester_email: { type: 'string' },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request / missing header',
      type: 'object',
      properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } },
    },
    500: {
      description: 'Server error',
      type: 'object',
      properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } },
    },
  },
};
