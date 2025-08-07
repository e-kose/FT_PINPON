export const getMeSchema = {
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      descripiton: "Kullanıcı bilgilerini alındı",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        user: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            email: { type: "string", example: "john@example.com" },
            username: { type: "string", example: "john_doe" },
            is_2fa_enabled: { type: "number", example: 0 },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2025-01-01T00:00:00Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              example: "2025-01-01T00:00:00Z",
            },
          },
        },
      },
    },
  },
};
