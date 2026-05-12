import "dotenv/config";

const baseUrl = process.env.SMOKE_BASE_URL ?? `http://localhost:${process.env.PORT ?? "4000"}`;

const checkEndpoint = async (path: string): Promise<void> => {
  const response = await fetch(new URL(path, baseUrl));

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  console.info(`${path} ${response.status}`);
};

const run = async (): Promise<void> => {
  await checkEndpoint("/health");
  await checkEndpoint("/ready");
  await checkEndpoint("/metrics");
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "HTTP smoke test failed");
  process.exit(1);
});
