export const sendFriendSchema = {
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string" },
    },
    required: ["x-user-id"],
  },
  body: {
    type: "object",
    properties: {
      toId: { type: "number" },
      toUsername: { type: "string" },
    },
    oneOf: [{ required: ["toId"] }, { required: ["toUsername"] }],
  },
  response: {
    201: {
      description: "Friend request created",
      type: "object",
      properties: {
        id: { type: "number" },
        success: { type: "boolean", example: true },
      },
    },
    400: {
      description: "Bad request",
      type: "object",
      properties: { success: { type: "boolean", example: false }, message: { type: "string" } },
    },
  },
};
