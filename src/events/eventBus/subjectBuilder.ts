import { supportedEventNames } from "../contracts/index.js";
import type { NotificationEventName } from "../contracts/index.js";

const trimDots = (value: string): string => value.replace(/^\.+|\.+$/g, "");

export const buildSubject = (prefix: string, eventName: NotificationEventName): string => {
  return `${trimDots(prefix)}.${eventName}`;
};

export const buildWildcardSubject = (prefix: string): string => {
  return `${trimDots(prefix)}.>`;
};

export const buildSupportedSubjects = (prefix: string): string[] => {
  return supportedEventNames.map((eventName) => buildSubject(prefix, eventName));
};

export const buildDurableName = (prefix: string, domain: string): string => {
  return `${trimDots(prefix)}-${domain}-notifications`;
};
