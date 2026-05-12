import { describe, expect, it } from "vitest";

import { MetricsRegistry } from "../src/observability/metricsRegistry.js";

describe("MetricsRegistry", () => {
  it("renders incremented counters in Prometheus text format", () => {
    const registry = new MetricsRegistry();
    const counter = registry.counter("test_counter_total", "Test counter.", ["result"]);

    counter.inc({ result: "success" });
    counter.inc({ result: "success" });

    expect(registry.render()).toContain("# TYPE test_counter_total counter");
    expect(registry.render()).toContain('test_counter_total{result="success"} 2');
  });
});
