import fp from "fastify-plugin";
import * as dotenv from "dotenv";
import { FastifyInstance } from "fastify";
import * as net from "net";
import pino from "pino";
dotenv.config();

export default fp(async (app: FastifyInstance) => {

  const serviceName = process.env.SERVICE_NAME || "auth-service";
  const logLevel = process.env.LOG_LEVEL || "info";
  const logstashHost = process.env.LOGSTASH_HOST || "localhost";
  const logstashPort = parseInt(process.env.LOGSTASH_PORT || "5044");
  const tcpClient = new net.Socket();

  tcpClient.connect(logstashPort, logstashHost, () => {
    app.log.info(`Connected to Logstash at ${logstashHost}:${logstashPort}`);
  });

  const logger = pino(
    {
      base: { service: serviceName },
      timestamp: pino.stdTimeFunctions.isoTime,
      level: logLevel,
    },
    { write: (msg) => tcpClient.write(msg + "\n") }
  );
  
  app.addHook("onRequest", async (req) => {
    app.logger.info({
      service: serviceName,
      method: req.method,
      url: req.url,
      msg: "Incoming request",
      time: new Date().toISOString(),
    });
  });
  app.decorate("logger", logger);
});
