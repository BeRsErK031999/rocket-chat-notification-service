import { AckPolicy, connect, DeliverPolicy, JSONCodec, StorageType } from "nats";
import type { ConsumerMessages, NatsConnection, Subscription } from "nats";

type NatsMessageHandler = (subject: string, data: unknown) => Promise<unknown>;

type DurableSubscribeInput = {
  streamName: string;
  durableName: string;
  filterSubject: string;
  handler: (message: JetStreamMessage) => Promise<unknown>;
};

export type JetStreamMessage = {
  subject: string;
  data: unknown;
  ack(): void;
};

export class NatsClient {
  private readonly codec = JSONCodec<unknown>();
  private connection: NatsConnection | null = null;
  private readonly subscriptions: Subscription[] = [];
  private readonly consumers: ConsumerMessages[] = [];

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

  async publishJetStream(subject: string, data: unknown): Promise<void> {
    await this.connect();
    await this.connection?.jetstream().publish(subject, this.codec.encode(data));
  }

  async ensureStream(streamName: string, subjects: string[]): Promise<void> {
    await this.connect();

    const manager = await this.connection?.jetstreamManager();

    if (manager === undefined) {
      return;
    }

    try {
      await manager.streams.info(streamName);
      await manager.streams.update(streamName, {
        subjects
      });
    } catch {
      await manager.streams.add({
        name: streamName,
        subjects,
        storage: StorageType.File
      });
    }
  }

  async ensureDurableConsumer(
    streamName: string,
    durableName: string,
    filterSubject: string
  ): Promise<void> {
    await this.connect();

    const manager = await this.connection?.jetstreamManager();

    if (manager === undefined) {
      return;
    }

    const config = {
      durable_name: durableName,
      name: durableName,
      filter_subject: filterSubject,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      max_deliver: 1,
      max_ack_pending: 32
    };

    try {
      await manager.consumers.info(streamName, durableName);
      await manager.consumers.update(streamName, durableName, config);
    } catch {
      await manager.consumers.add(streamName, config);
    }
  }

  async subscribeDurable({
    streamName,
    durableName,
    filterSubject,
    handler
  }: DurableSubscribeInput): Promise<void> {
    await this.ensureDurableConsumer(streamName, durableName, filterSubject);

    const consumer = await this.connection?.jetstream().consumers.get(streamName, durableName);

    if (consumer === undefined) {
      return;
    }

    const messages = await consumer.consume();
    this.consumers.push(messages);

    void (async () => {
      for await (const message of messages) {
        const data = this.decode(message.data);
        const wrappedMessage: JetStreamMessage = {
          subject: message.subject,
          data,
          ack: () => {
            message.ack();
          }
        };

        await handler(wrappedMessage);
      }
    })();
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
        await handler(message.subject, this.decode(message.data));
      }
    })();
  }

  async close(): Promise<void> {
    for (const consumer of this.consumers) {
      await consumer.close();
    }

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }

    await this.connection?.drain();
    this.connection = null;
  }

  private decode(data: Uint8Array): unknown {
    try {
      return this.codec.decode(data);
    } catch {
      return null;
    }
  }
}
