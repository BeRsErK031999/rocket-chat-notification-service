import { connect, JSONCodec } from "nats";
import type { NatsConnection, Subscription } from "nats";

type NatsMessageHandler = (subject: string, data: unknown) => Promise<unknown>;

export class NatsClient {
  private readonly codec = JSONCodec<unknown>();
  private connection: NatsConnection | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly servers: string) {}

  async connect(): Promise<void> {
    if (this.connection !== null) {
      return;
    }

    this.connection = await connect({ servers: this.servers });
  }

  async publish(subject: string, data: unknown): Promise<void> {
    await this.connect();
    this.connection?.publish(subject, this.codec.encode(data));
  }

  async subscribe(subject: string, handler: NatsMessageHandler): Promise<void> {
    await this.connect();

    const subscription = this.connection?.subscribe(subject);

    if (subscription === undefined) {
      return;
    }

    this.subscriptions.push(subscription);

    void (async () => {
      for await (const message of subscription) {
        let data: unknown = null;

        try {
          data = this.codec.decode(message.data);
        } catch {
          data = null;
        }

        await handler(message.subject, data);
      }
    })();
  }

  async close(): Promise<void> {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }

    await this.connection?.drain();
    this.connection = null;
  }
}
