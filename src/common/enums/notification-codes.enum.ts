import { NotificationMetadata } from '../constants/notification-metadata.js';

/**
 * The NotificationCode list is automatically derived from the NotificationMetadata keys.
 * This ensures that adding a new notification to the metadata automatically makes its code available.
 */
export const NotificationCode = Object.freeze(
  Object.keys(NotificationMetadata).reduce(
    (acc, key) => {
      acc[key] = key;
      return acc;
    },
    {} as Record<string, string>,
  ) as { [K in keyof typeof NotificationMetadata]: K },
);

export type NotificationCode = keyof typeof NotificationMetadata;
