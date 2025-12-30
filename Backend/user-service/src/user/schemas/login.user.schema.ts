
export const loginUserSchema = {
  headers: {
    type: "object",
    properties: {
      "X-Internal-Secret": { 
        type: "string",
        pattern: "^[a-zA-Z0-9_-]+$"  // XSS koruması: güvenli karakterler
      },
    },
    required: ["X-Internal-Secret"],
  },
  body: {
    type: "object",
    properties: {
      email: { type: "string", format: "email", pattern: "^[^<>&\"']+$" },
      username: { type: "string", minLength: 3, maxLength: 30, pattern: "^[^<>&\"']+$" },
      password: { type: "string", minLength: 6, maxLength: 100 },
    },
    oneOf: [
      { required: ["email"] },
      { required: ["username"] }
    ],
  },
  response: {
    200: {
      description: "User logged in successfully",
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        username: { type: "string" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
        is_2fa_enabled: { type: "boolean" },
        success: { type: "boolean", example: true },
        message: { type: "string", example: "User successfully logged in" },
      },
    },
    401: {
      description: "Unauthorized",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Unauthorized" },
      },
    },
    404: {
      description: "User not found",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "User not found" },
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
