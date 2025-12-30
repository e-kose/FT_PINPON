export const registerUserSchema = {
  headers: {
    type: "object",
    properties: {
      "X-Internal-Secret": { 
        type: "string",
        pattern: "^[a-zA-Z0-9_-]+$"  // XSS koruması
      },
      "x-user-id": { 
        type: "string",
        pattern: "^[0-9]+$"  // XSS koruması: sadece sayı
      },
      "x-user-email": { 
        type: "string", 
        format: "email",
        pattern: "^[^<>&\"']+$"  // XSS koruması: HTML yasak
      }
    },
    required: ["X-Internal-Secret"],
  },
  body: {
    type: "object",
    properties: {
      username: { type: "string", minLength: 3, maxLength: 30, pattern: "^[^<>&\"']+$" },
      password: { type: "string", minLength: 6, maxLength: 100 },
      email: { type: "string", format: "email", pattern: "^[^<>&\"']+$" },
      profile: {
        type: "object",
        properties: {
          full_name: { type: "string", minLength: 1, maxLength: 100, pattern: "^[^<>&\"']+$" },
          avatar_url: { type: "string", format: "uri" },
        },
        required: ["full_name", "avatar_url"],
      },
    },
    required: ["username", "email", "profile"],
  },
  response: {
    201: {
      description: "User registered successfully",
      type: "object",
      properties: {
        userId: { type: "string", example: "12345" },
        success: { type: "boolean", example: true },
        message: { type: "string", example: "User successfully created" },
      },
    },
    403: {
      description: "Forbidden",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Forbidden" },
      },
    },
    409: {
      description: "User already exists",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "User already exists" },
      },
    },
    500: {
      description: "Internal server error",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Internal server error" },
      },
    },
  },
};
