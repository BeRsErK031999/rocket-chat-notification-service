import { env } from "./config/env.js";
import { buildApp } from "./app.js";

const app = buildApp();
const host = "0.0.0.0";
let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  app.log.info({ signal }, "shutdown received");

  try {
    await app.close();
    app.log.info({ signal }, "server stopped");
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error, signal }, "graceful shutdown failed");
    process.exit(1);
  }
};

const start = async (): Promise<void> => {
  try {
    app.log.info({ host, port: env.PORT, service: "notification-service" }, "starting server");

    const address = await app.listen({
      host,
      port: env.PORT
    });

    app.log.info({ address, service: "notification-service" }, "server started");
  } catch (error) {
    app.log.error({ err: error, service: "notification-service" }, "server startup failed");
    process.exit(1);
  }
};

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});

process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});

void start();
