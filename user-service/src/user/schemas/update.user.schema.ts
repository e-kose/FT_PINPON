export const updateUserSchema = {
  security: [{ bearerAuth: [] }],
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
      email: { type: "string", format: "email" },
      name: { type: "string" },
      profile: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          avatar_url: { type: "string", format: "uri" },
          bio: { type: "string" },
        },
      },
    },
  },
  response: {
    200: {
      description: "User updated successfully",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "User successfully updated" },
      },
    },
    400: {
      description: "Bad request",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Bad request" },
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

export const updateAvatarSchema = {
  security: [{ bearerAuth: [] }],
  description: "User avatar successfully",
  consumes: ["multipart/form-data"],
  body: {
    properties: {
      avatar: {
        type: "string",
        format: "binary",
        description: "Yüklenecek avatar dosyası (image)",
      },
    },
    required: ["avatar"],
    additionalProperties: false,
  },
  response: {
    200: {
      description: "Avatar başarıyla güncellendi",
      type: "object",
      properties: {
        success: { type: "boolean" },
        avatar_url: { type: "string" },
      },
    },
    406: {
      description: "Hatalı içerik tipi",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
    404: {
      description: "Kullanıcı bulunamadı",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
  },
};

export const updatePasswordSchema = {
  security: [{ bearerAuth: [] }],
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
      oldPass: { type: "string" },
      newPass: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Password Changed",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: {
          type: "string",
          example: "The password has been successfully changed.",
        },
      },
    },
    400: {
      description: "Bad request",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Bad request" },
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
