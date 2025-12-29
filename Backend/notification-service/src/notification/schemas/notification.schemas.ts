export const createNotificationSchema = {
    body: {
        type: 'object',
        required: ['to_user_id', 'title', 'message'],
        properties: {
            to_user_id: { type: 'number', minimum: 1 },
            title: { type: 'string', minLength: 1, maxLength: 255 },
            message: { type: 'string', minLength: 1 },
            type: {
                type: 'string',
                enum: ['game_invite', 'chat_message', 'friend_request'],
                default: 'chat_message'
            }
        }
    }
};

export const updateNotificationSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'number', minimum: 1 }
        }
    },
    body: {
        type: 'object',
        properties: {
            is_read: { type: 'boolean' },
            title: { type: 'string', minLength: 1, maxLength: 255 },
            message: { type: 'string', minLength: 1 },
            type: {
                type: 'string',
                enum: ['game_invite', 'chat_message', 'friend_request']
            }
        }
    }
};

export const getNotificationSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'number', minimum: 1 }
        }
    }
};

export const deleteNotificationSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'number', minimum: 1 }
        }
    }
};

export const getNotificationsSchema = {
    querystring: {
        type: 'object',
        properties: {
            is_read: { type: 'boolean' },
            type: {
                type: 'string',
                enum: ['game_invite', 'chat_message', 'friend_request']
            },
            from_user_id: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'number', minimum: 0, default: 0 }
        }
    }
};

export const markAllAsReadSchema = {
    body: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['game_invite', 'chat_message', 'friend_request']
            },
            from_user_id: { type: 'number', minimum: 1 }
        }
    }
};
