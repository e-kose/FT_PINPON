export const registerUserSchema = {
  headers: {
    type: "object",
    properties: {
      "X-Internal-Secret": { type: "string" },
      "x-user-id": { type: "string" },
      "x-user-email": { type: "string", format: "email" }
    },
    required: ["X-Internal-Secret"],
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
