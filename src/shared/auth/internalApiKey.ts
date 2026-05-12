import type { FastifyReply, FastifyRequest } from "fastify";

export const internalApiKeyHeader = "x-internal-api-key";

export const requireInternalApiKey = (
  configuredApiKey: string | undefined,
  request: FastifyRequest,
  reply: FastifyReply
): boolean => {
  if (configuredApiKey === undefined || configuredApiKey.length === 0) {
    return true;
  }

  const headerValue = request.headers[internalApiKeyHeader];
  const apiKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (apiKey === configuredApiKey) {
    return true;
  }

  void reply.status(401).send({ error: "Unauthorized" });
  return false;
};
