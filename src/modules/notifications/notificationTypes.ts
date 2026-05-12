export type SendNotificationInput = {
  channel: string;
  text: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type SendNotificationResult = {
  ok: true;
};
