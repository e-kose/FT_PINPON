export const logoutSchema = {
  response: {
    200: {
      description: "Başarılı çıkış",
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'The exit has been made.' }
      }
    },
    401: {
      description: 'Token geçersiz',
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Token is invalid or deleted' }
      }
    },
	500: {
	  description: 'Sunucu hatası',
	  type: 'object',
	  properties: {
		success: { type: 'boolean', example: false },
		message: { type: 'string', example: 'An error has occurred' }
	  }
	}
  }
};