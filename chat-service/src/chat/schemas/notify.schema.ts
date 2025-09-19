export const notifySchema = {
  body: {
    type: "object",
    required: ["user_id", "message"],
    properties: {
      user_id: { type: "number" },
      message: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Kullanıcıya bildirim gönderildi",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        notifyId: { type: "number", example: 1 },
      },
    },
    500: {
      description: "Sunucu hatası",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "An error has occurred" },
      },
    },
  },
};

export const getNotifySchema = {
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Kullanıcıya gelen bildirimler getirildi",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        notifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", exapmle: 1 },
              user_id: { type: "number", exapmle: 1 },
              content: { type: "string", example: "Turnuva başlamak üzere" },
              created_at: {
                type: "string",
                format: "date-time",
                example: "2025-01-01T00:00:00Z",
              },
            },
          },
        },
      },
    },
    500: {
      description: "Sunucu hatası",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "An error has occurred" },
      },
    },
  },
};
