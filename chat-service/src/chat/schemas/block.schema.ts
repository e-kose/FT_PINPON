export const blockSchema = {
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    properties: {
      blocked_user_id: { type: "number" },
    },
    required: ["blocked_user_id"],
    additionalProperties: false,
  },
  response: {
    200: {
      description: "Kullanıcı engenlendi",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        blockId: { type: "number", example: 1 },
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

export const removeBlockSchema = {
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    properties: {
      blocked_user_id: { type: "number" },
    },
    required: ["blocked_user_id"],
    additionalProperties: false,
  },
  response: {
    200: {
      description: "Kullanıcı engeli kaldırıldı",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        affectedRow: { type: "number", example: 1 },
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

export const blockListSchema = {
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Engellenen kullanıclar getirildi",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        blockList: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              blocked_id: { type: "number", example: 1 },
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
