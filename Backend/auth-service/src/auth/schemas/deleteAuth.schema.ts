export const deleteAuthSchema = {
  headers: {
    type: "object",
    properties: {
      "X-Internal-Secret": { 
        type: "string",
        pattern: "^[a-zA-Z0-9_-]+$"  // XSS koruması: güvenli karakterler
      },
      "x-user-id": { 
        type: "string",
        pattern: "^[0-9]+$"  // sadece sayı
      },
    },
    required: ["X-Internal-Secret"],
  },
  response: {
    200: {
      description: "Auth data deleted successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "Auth data successfully deleted" },
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
    403: {
      description: "Forbidden",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Forbidden" },
      },
    },
    404: {
      description: "Auth data not found",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Auth data not found" },
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
