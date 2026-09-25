export type NotificationChannel = "in_app" | "push" | "email";

export type NotificationKind =
  | "new_release"
  | "recommendation"
  | "artist_post"
  | "playlist_activity"
  | "security"
  | "billing"
  | "rights"
  | "system";

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  newReleases: boolean;
  recommendations: boolean;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  data: Record<string, string>;
  createdAt: string;
}

export interface DeliveryIntent {
  eventId: string;
  userId: string;
  channel: NotificationChannel;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  deliver(event: NotificationEvent): Promise<void>;
}

export function isChannelEnabled(
  preferences: NotificationPreferences,
  channel: NotificationChannel,
  kind: NotificationKind
): boolean {
  if (kind === "security") return channel !== "push" || preferences.push;
  if (channel === "email") {
    return preferences.email &&
      (kind !== "new_release" || preferences.newReleases) &&
      (kind !== "recommendation" || preferences.recommendations);
  }

  if (channel === "push") {
    return preferences.push &&
      (kind !== "new_release" || preferences.newReleases) &&
      (kind !== "recommendation" || preferences.recommendations);
  }

  return true;
}

export function planDelivery(
  event: NotificationEvent,
  preferences: NotificationPreferences
): DeliveryIntent[] {
  const channels: NotificationChannel[] = [
    "in_app",
    "push",
    "email"
  ];

  return channels
    .filter(channel => isChannelEnabled(preferences, channel, event.kind))
    .map(channel => ({
      eventId: event.id,
      userId: event.userId,
      channel
    }));
}
