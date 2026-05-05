import { NotificationCode } from '../enums/notification-codes.enum.js';
import { NotificationMetadata as RawMetadata } from './notification-metadata.js';

/**
 * The NotificationRegistry provides the full metadata for any given NotificationCode.
 */
export const NotificationRegistry: Record<
  NotificationCode,
  { description: string; args?: Record<string, unknown> }
> = RawMetadata;

export type NotificationArgsMap = {
  [K in NotificationCode]: (typeof RawMetadata)[K] extends {
    args: infer A;
  }
    ? { [P in keyof A]: string }
    : Record<string, never>;
};
