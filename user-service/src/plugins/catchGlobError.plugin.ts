import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyError } from "fastify";

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler(function (error: FastifyError, request:any, reply: FastifyReply) {
    if ((error as any).validation) {
      return reply.status(400).send({
        success: false,
        error: "Bad Request",
        message: error.message || "Geçersiz veri",
        errors: (error as any).validation,
      });
    }

    if(error.code === 'FORBIDDEN'){
      return reply.status(403).send({
        success: false,
        message: error.message || "Geçersiz veri",
      });
    }

    return reply.status(500).send({
      success: false,
      error: "Internal Server Error",
      message: error.message || "Sunucu hatası",
    });
  });
});