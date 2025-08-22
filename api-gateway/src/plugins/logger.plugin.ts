import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import * as dotenv from "dotenv";
import * as net from "net";
import pino from "pino";

dotenv.config();

export default fp(async (app: FastifyInstance) => {
  const serviceName = process.env.SERVICE_NAME || "api-gateway";
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
  app.decorate("logger", logger);

  app.addHook("onRequest", async (req) => {
  req.startTime = Date.now();
  app.logger.info({
    service: serviceName,
    method: req.method,
    url: req.url,
    msg: "Incoming request",
    time: new Date().toISOString(),
  });
});

app.addHook("onResponse", async (req, reply) => {
  const duration = Date.now() - (req.startTime ?? Date.now());
  app.logger.info({
    service: serviceName,
    method: req.method,
    url: req.url,
    msg: "Request completed",
    duration,
    time: new Date().toISOString(),
  });
});
});
