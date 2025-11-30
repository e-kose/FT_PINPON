export const listFriendsSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  response: {
    200: {
      description: 'Sanitized friends list',
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        friends: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'friend_id', 'friend_username', 'friend_avatar_url'],
            properties: {
              id: { type: 'number', example: 123 },
              friend_id: { type: 'number', example: 456 },
              friend_username: { type: 'string', example: 'alice' },
              friend_email: { type: 'string', format: 'email', example: 'alice@example.com' },
              friend_full_name: { type: 'string', example: 'Alice Example' },
              friend_avatar_url: { type: 'string', format: 'uri', example: 'https://cdn.example.com/avatars/456.png' },
            },
          },
        },
      },
      example: {
        success: true,
        friends: [
          { id: 1, friend_id: 2, friend_username: 'bob', email: 'bob@example.com', friend_full_name: 'Bob B', bio: 'Hello', friend_avatar_url: 'https://.../bob.png' }
        ]
      }
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
              friend_id: { type: 'number' },
              status: { type: 'string' },
              friend_username: { type: 'string' },
              friend_full_name: { type: 'string' },
              friend_avatar_url: { type: ['string', 'null'] },
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
