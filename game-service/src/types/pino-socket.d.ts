declare module "pino-socket" {
  import { Duplex } from "stream";

  interface PinoSocketOptions {
    address?: string;
    port?: number;
    reconnect?: boolean;
    reconnectTries?: number;
  }

  function pinoSocket(options: PinoSocketOptions): Duplex;

  export = pinoSocket;
}
