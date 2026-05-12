import "dotenv/config";

import { connect, JSONCodec } from "nats";

import { env } from "../src/config/env.js";

const readLastDlqMessage = async (): Promise<void> => {
  const connection = await connect({ servers: env.NATS_URL });
  const codec = JSONCodec<unknown>();

  try {
    const manager = await connection.jetstreamManager();
    const message = await manager.streams.getMessage(env.NATS_STREAM_NAME, {
      last_by_subj: env.NATS_DLQ_SUBJECT
    });

    console.info(
      JSON.stringify(
        {
          subject: env.NATS_DLQ_SUBJECT,
          seq: message.seq,
          timestamp: message.timestamp,
          payload: codec.decode(message.data)
        },
        null,
        2
      )
    );
  } finally {
    await connection.drain();
  }
};

void readLastDlqMessage();
