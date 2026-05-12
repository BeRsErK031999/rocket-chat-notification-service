import type { FastifyPluginCallback } from "fastify";

import { metricsRegistry } from "./metrics.js";

export const createMetricsRoutes = (): FastifyPluginCallback => {
  return (fastify, _options, done) => {
    fastify.get("/metrics", (_request, reply) => {
      return reply.type("text/plain; version=0.0.4; charset=utf-8").send(metricsRegistry.render());
    });

    done();
  };
};
