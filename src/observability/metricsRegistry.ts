type Labels = Record<string, string>;

type CounterSample = {
  labels: Labels;
  value: number;
};

const escapeLabelValue = (value: string): string => {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
};

const labelKey = (labels: Labels): string => {
  return Object.entries(labels)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
};

const formatLabels = (labels: Labels): string => {
  const entries = Object.entries(labels).sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return "";
  }

  return `{${entries.map(([key, value]) => `${key}="${escapeLabelValue(value)}"`).join(",")}}`;
};

export class Counter {
  private readonly samples = new Map<string, CounterSample>();

  constructor(
    readonly name: string,
    readonly help: string,
    private readonly labelNames: readonly string[] = []
  ) {}

  inc(labels: Labels = {}, value = 1): void {
    this.assertLabels(labels);

    const key = labelKey(labels);
    const sample = this.samples.get(key);

    if (sample === undefined) {
      this.samples.set(key, {
        labels,
        value
      });
      return;
    }

    sample.value += value;
  }

  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];

    for (const sample of this.samples.values()) {
      lines.push(`${this.name}${formatLabels(sample.labels)} ${sample.value}`);
    }

    return lines.join("\n");
  }

  reset(): void {
    this.samples.clear();
  }

  private assertLabels(labels: Labels): void {
    const expected = [...this.labelNames].sort();
    const actual = Object.keys(labels).sort();

    if (expected.length !== actual.length || expected.some((label, index) => label !== actual[index])) {
      throw new Error(`Invalid labels for counter ${this.name}`);
    }
  }
}

export class MetricsRegistry {
  private readonly counters: Counter[] = [];

  counter(name: string, help: string, labelNames: readonly string[] = []): Counter {
    const counter = new Counter(name, help, labelNames);
    this.counters.push(counter);
    return counter;
  }

  render(): string {
    return `${this.counters.map((counter) => counter.render()).join("\n\n")}\n`;
  }

  reset(): void {
    for (const counter of this.counters) {
      counter.reset();
    }
  }
}
