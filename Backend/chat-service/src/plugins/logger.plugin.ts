import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import net from "net";
import pino from "pino";

export default fp(async function logger(app: FastifyInstance) {
  const serviceName = process.env.SERVICE_NAME || "chat-service";
  const logstashHost = process.env.LOGSTASH_HOST || "logstash";
  const logLevel = process.env.LOG_LEVEL || "info";
  const logstashPort = +(process.env.LOGSTAH_PORT || "5044");

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

  app.addHook("onRequest", async (req) => {
    app.logger.info({
      service: serviceName,
      method: req.method,
      url: req.url,
      msg: "Incoming request",
      time: new Date().toISOString(),
    });
  });
});
