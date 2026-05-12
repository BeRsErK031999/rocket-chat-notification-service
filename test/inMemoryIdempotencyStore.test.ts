import { describe, expect, it } from "vitest";

import { InMemoryIdempotencyStore } from "../src/events/idempotency/inMemoryIdempotencyStore.js";

describe("InMemoryIdempotencyStore", () => {
  it("expires recorded event ids after ttl", () => {
    let now = 1000;
    const store = new InMemoryIdempotencyStore(500, () => now);

    store.record("event-1");

    expect(store.has("event-1")).toBe(true);

    now = 1501;

    expect(store.has("event-1")).toBe(false);
  });
});
