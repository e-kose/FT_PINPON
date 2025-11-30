export const getUserSchema = {
  response: {
    200: {
      description: "User found",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            is_2fa_enabled: { type: "boolean" },
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
            profile: {
              type: "object",
              properties: {
                user_id: { type: "number" },
                full_name: { type: "string" },
                avatar_url: { type: "string", format: "uri" },
                bio: { type: "string" },
              },
            },
          },
        },
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
