export const twoFacSetupSchema = {
  security: [{ bearerAuth: [] }],
  response: {
    201: {
      description: "Kulanıcı için 2FA Secret oluşturma",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        qr: { type: "string", example: "data:image/..........." },
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
};

export const twoFacEnableSchema = {
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["token"],
    additionalProperties: false,
    properties: {
      token: {
        type: "string",
        maxLength: 10,
      },
    },
  },
  response: {
    201: {
      description: "Kullanıcı 2FA Aktif Etme",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "2FA enabled" },
      },
    },
  },
  400: {
	description: "Kullanıcı için 2FA secret oluşturulmamış",
	 type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "2FA not initialized" },
      },
  },
  401: {
      description: "Token geçersiz",
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Token is invalid or deleted" },
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
};


export const twoFacDisableSchema = {
  security: [{ bearerAuth: [] }],
  response: {
    201: {
      description: "Kullanıcı 2FA Pasif Etme",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "2FA disabled" },
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
};