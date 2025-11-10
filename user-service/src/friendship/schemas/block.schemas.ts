export const blockSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  body: {
    type: 'object',
    properties: { blocked_id: { type: 'number' } },
    required: ['blocked_id'],
  },
  response: {
    201: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true }, id: { type: 'number' } },
    },
    400: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
  },
};

export const getBlockedSchema = {
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
        blocked: {
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
            },
          },
        },
      },
    },
    400: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
  },
};

export const unblockSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  body: {
    type: 'object',
    properties: { blocked_id: { type: 'number' } },
    required: ['blocked_id'],
  },
  response: {
    200: { type: 'object', properties: { success: { type: 'boolean', example: true }, affected: { type: 'number' } } },
    400: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
  },
};

export const removeFriendSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  body: {
    type: 'object',
    properties: { friend_id: { type: 'number' } },
    required: ['friend_id'],
  },
  response: {
    200: { type: 'object', properties: { success: { type: 'boolean', example: true }, affected: { type: 'number' } } },
    400: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
  },
};
