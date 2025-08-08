export const OAuthSchema = {
  response: {
    200: {
      description: "Başarılı giriş",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        accessToken: {
          type: "string",
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
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
