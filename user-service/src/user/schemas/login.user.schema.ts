export const loginUserSchema = {
  headers: {
    type: "object",
    properties: {
      "x-api-key": { type: "string" },
    },
    required: ["x-api-key"],
  },
  response: {
    200: {
      description: "User logged in successfully",
      type: "object",
      properties: {
        user: { type: "object" },
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
