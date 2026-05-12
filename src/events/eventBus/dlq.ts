import type { EventProcessingResult } from "../consumers/consumerHandler.js";

export type DeadLetterPayload = {
  originalSubject: string;
  eventId?: string;
  correlationId?: string;
  event?: string;
  source?: string;
  severity?: string;
  failureReason: EventProcessingResult["status"];
  failedAt: string;
  originalPayload: unknown;
};

const readStringField = (payload: unknown, field: string): string | undefined => {
  if (typeof payload !== "object" || payload === null || !(field in payload)) {
    return undefined;
  }

  const value = (payload as Record<string, unknown>)[field];

  return typeof value === "string" ? value : undefined;
};

export const buildDeadLetterPayload = (
  originalSubject: string,
  originalPayload: unknown,
  failureReason: EventProcessingResult["status"]
): DeadLetterPayload => {
  const payload: DeadLetterPayload = {
    originalSubject,
    failureReason,
    failedAt: new Date().toISOString(),
    originalPayload
  };

  const eventId = readStringField(originalPayload, "eventId");
  const correlationId = readStringField(originalPayload, "correlationId");
  const event = readStringField(originalPayload, "event");
  const source = readStringField(originalPayload, "source");
  const severity = readStringField(originalPayload, "severity");

  if (eventId !== undefined) {
    payload.eventId = eventId;
  }

  if (correlationId !== undefined) {
    payload.correlationId = correlationId;
  }

  if (event !== undefined) {
    payload.event = event;
  }

  if (source !== undefined) {
    payload.source = source;
  }

  if (severity !== undefined) {
    payload.severity = severity;
  }

  return payload;
};
