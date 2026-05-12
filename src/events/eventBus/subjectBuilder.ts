import type { NotificationEventName } from "../contracts/index.js";

const trimDots = (value: string): string => value.replace(/^\.+|\.+$/g, "");

export const buildSubject = (prefix: string, eventName: NotificationEventName): string => {
  return `${trimDots(prefix)}.${eventName}`;
};

export const buildWildcardSubject = (prefix: string): string => {
  return `${trimDots(prefix)}.>`;
};
