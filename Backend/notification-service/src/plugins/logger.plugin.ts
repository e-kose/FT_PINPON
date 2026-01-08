import fp from "fastify-plugin";
import * as dotenv from "dotenv";
import { FastifyInstance } from "fastify";
import * as net from "net";
import pino from "pino";

dotenv.config();

export default fp(async (app: FastifyInstance) => {
  const serviceName = "notification-service";
  const logLevel = process.env.LOG_LEVEL || "info";
  const logstashHost = process.env.LOGSTASH_HOST || "logstash";
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
    {
      write: (msg) => tcpClient.write(msg + "\n"),
    }
  );

  app.decorate("logger", logger);

  app.addHook("onRequest", async(req) => {
    app.logger.info({
      service: serviceName,
      url: req.url,
      method: req.method,
      msg: "Incoming Request",
      time: new Date().toISOString(),
    })
  })
});
