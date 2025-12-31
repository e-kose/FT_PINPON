export const registerUserSchema = {
  body: {
    type: "object",
    required: ["username", "password", "email", "profile"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 254,
        pattern: "^[^<>&\"']+$"
      },
      username: {
        type: "string",
        minLength: 3,
        maxLength: 32,
        pattern: "^[a-zA-Z0-9_]+$",
      },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 64,
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
      },
      
      profile: {
        type: "object",
        required: ["full_name"],
        properties: {
          full_name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            pattern: "^[^<>&\"']*$"
          },
          avatar_url: {
            type: "string",
            format: "uri",
            pattern: "^https?://[^<>&\"']+$"
          },
        },
      },
    },
  },
  response: {
    201: {
      description: "Başarılı işlem",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "User successfully created" },
      },
    },
    400: {
      description: "Geçersiz veri",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Invalid data entry" },
      },
    },
    409: {
      desription: "Kullanıcı zaten mevcut",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: {
          type: "string",
          example: "User with this email already exists",
        },
      },
      500: {
        description: "Sunucu hatası",
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: {
            type: "string",
            example: "An error has occurred",
          },
        },
      },
    },
  },
};
