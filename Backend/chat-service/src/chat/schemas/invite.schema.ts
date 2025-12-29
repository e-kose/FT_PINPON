export const inviteSchema = {
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["to_user_id"],
    properties: {
      to_user_id: { type: "number" },
    },
  },
  response: {
    201: {
      description: "Kullanıcıya davet gönderildi",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        inviteId: { type: "number", example: 1 },
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

export const getInvitesSchema = {
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["received", "sent"], default: "received" },
    },
  },
  response: {
    200: {
      description: "Kullanıcı gelen/giden davetler getirildi",
      type: "object",
      properties: {
        success: { type: "boolean" },
        invites: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              inviting_user: { type: "number" },
              invited_user: { type: "number" },
              created_at: {
                type: "string",
                format: "date-time",
                example: "2025-01-01T00:00:00Z",
              },
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
