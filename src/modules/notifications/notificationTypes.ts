export type SendNotificationInput = {
  channel: string;
  text: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type MappedNotification = Omit<SendNotificationInput, "channel">;

export type SendNotificationResult = {
  ok: true;
};
