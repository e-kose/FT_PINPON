import { FastifyPluginAsync } from 'fastify';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, req, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        message: 'Geçersiz veri',
        errors: error.validation,
      });
    }

    reply.status(500).send({
      success: false,
      message: 'Sunucu hatası',
    });
  });
};

export default errorHandlerPlugin;