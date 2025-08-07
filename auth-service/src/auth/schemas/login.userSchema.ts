export const loginUserSchema = {
  body: {
    type: "object",
    required: ["password"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 254,
      },
      username: {
        type: "string",
      },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 64,
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
      },
    },
    anyOf: [{ required: ["email"] }, { required: ["username"] }],
  },
  response: {
    201: {
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
    400: {
      description: "Geçersiz veri",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Bad Request" },
        message: { type: "string", example: "body/email must be string" },
      },
    },
    401: {
      description: "Hatalı giriş bilgisi",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Wrong mail or credentials" },
      },
    },
    404: {
      description: "Kullanıcı bulunamadı",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "User not found" },
      },
    },
  },
};
