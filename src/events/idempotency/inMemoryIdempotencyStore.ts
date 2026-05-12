import type { IdempotencyStore } from "./idempotencyStore.js";

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly processedEventIds = new Map<string, number>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  has(eventId: string): boolean {
    this.deleteExpired();

    const expiresAt = this.processedEventIds.get(eventId);

    if (expiresAt === undefined) {
      return false;
    }

    if (expiresAt <= this.now()) {
      this.processedEventIds.delete(eventId);
      return false;
    }

    return true;
  }

  record(eventId: string): void {
    this.deleteExpired();
    this.processedEventIds.set(eventId, this.now() + this.ttlMs);
  }

  private deleteExpired(): void {
    const currentTime = this.now();

    for (const [eventId, expiresAt] of this.processedEventIds.entries()) {
      if (expiresAt <= currentTime) {
        this.processedEventIds.delete(eventId);
      }
    }
  }
}
