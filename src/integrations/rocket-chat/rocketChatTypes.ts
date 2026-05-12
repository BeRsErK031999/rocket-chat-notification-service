export type RocketChatPostMessagePayload = {
  channel: string;
  text: string;
};

export type RocketChatPostMessageResult = {
  ok: true;
};

export type RocketChatClientPort = {
  postMessage(payload: RocketChatPostMessagePayload): Promise<RocketChatPostMessageResult>;
  healthCheck(): Promise<boolean>;
  channelExists(channel: string): Promise<boolean>;
};
