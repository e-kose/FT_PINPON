export const getMeSchema = {
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "Kullanıcı bilgilerini alındı",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        user: {
          type: "object",
          properties: {
            id: { type: "number", example: 1 },
            email: { type: "string", example: "john@example.com" },
            username: { type: "string", example: "john_doe" },
            is_2fa_enabled: { type: "string", example: "0" },
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
            profile : {
              type: 'object',
              properties : {
                user_id : { type: 'number', example: 1 },
                full_name : { type : 'string' , example : 'john doe'},
                avatar_url : { type : 'string', example : "upload/........."},
                bio : { type : 'string', example: "........."}
              }
            }
          },
        },
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
