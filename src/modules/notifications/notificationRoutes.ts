import type { FastifyPluginCallback } from "fastify";
import { ZodError } from "zod";

import { AppError } from "../../shared/errors.js";
import { sendNotificationSchema } from "./notificationSchemas.js";
import type { NotificationService } from "./notificationService.js";

type NotificationRoutesOptions = {
  notificationService: NotificationService;
};

export const createNotificationRoutes = ({
  notificationService
}: NotificationRoutesOptions): FastifyPluginCallback => {
  return (fastify, _options, done) => {
    fastify.post("/send", async (request, reply) => {
      try {
        const body = sendNotificationSchema.parse(request.body);
        const result = await notificationService.send(body);

        return reply.send(result);
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            error: "ValidationError",
            message: "Invalid notification payload",
            details: error.flatten()
          });
        }

        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({
            error: error.name,
            message: error.message
          });
        }

        throw error;
      }
    });

    done();
  };
};
