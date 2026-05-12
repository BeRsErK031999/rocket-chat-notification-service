export type IdempotencyStore = {
  has(eventId: string): boolean;
  record(eventId: string): void;
};
