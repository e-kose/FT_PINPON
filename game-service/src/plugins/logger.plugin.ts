import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import pinoSocket from "pino-socket";

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  const logstashHost = process.env.LOGSTASH_HOST || "logstash";
  const logstashPort = parseInt(process.env.LOGSTASH_PORT || "5044");

  try {
    const logstashStream = pinoSocket({
      address: logstashHost,
      port: logstashPort,
      reconnect: true,
      reconnectTries: 10,
    });

    logstashStream.on("connect", () => {
      fastify.log.info(`Connected to Logstash at ${logstashHost}:${logstashPort}`);
    });

    logstashStream.on("error", (err: Error) => {
      fastify.log.warn({ err }, "Logstash connection error (non-fatal)");
    });

    // Note: Adding streams to an existing pino instance is not directly supported.
    // This connection will be established, but logs won't be piped to it automatically with this setup.
    // fastify.log = fastify.log.child({}, { stream: logstashStream }); // This is incorrect and causes a build error.
  } catch (error: any) {
    fastify.log.warn("Could not connect to Logstash:", error.message);
  }
});
