export const conversationSchema = {
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: {
      id: { type: "number" },
    },
    required: ["id"],
  },
  querystring: {
    type: "object",
    properties: {
      offset: { type: "number", minimum: 0, default: 0 },
      limit: { type: "number", minimum: 1, default: 50 },
    },
  },
  response: {
    200: {
      description: "Sohbet geçmişi getirildi",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        chat: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              content: { 
                type: "string", 
                example: "Selam",
                pattern: "^[^<>&\"']+$"  // XSS koruması (response'da önerilen)
              },
              created_at: {
                type: "string",
                format: "date-time",
                example: "2025-01-01T00:00:00Z",
              },
              sender: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  username: { type: "string", example: "johnDue" },
                  avatar_url: { type: "string", example: "upload/........." },
                },
              },
              receiver: {
                type: "object",
                properties: {
                  id: { type: "number", example: 1 },
                  username: { type: "string", example: "johnDue" },
                  avatar_url: { type: "string", example: "upload/........." },
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Chat bulunamadı",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Chat not found" },
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
