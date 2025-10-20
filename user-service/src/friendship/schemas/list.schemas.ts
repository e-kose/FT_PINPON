export const listFriendsSchema = {
  headers: {
    type: 'object',
    properties: { 'x-user-id': { type: 'string' } },
    required: ['x-user-id'],
  },
  response: {
    200: {
      description: 'List of friends',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          user_id: { type: 'number' },
          friend_id: { type: 'number' },
          status: { type: 'string' },
          friend_username: { type: 'string' },
          friend_email: { type: 'string' },
        },
      },
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
      description: 'List of friend requests',
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
};
