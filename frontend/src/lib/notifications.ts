export type NotificationKind = "chapter" | "recommendation" | "library";

export type SenpaiNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  href: string;
  unread: boolean;
};

export const NOTIFICATIONS_UPDATED_EVENT = "senpai-notifications-updated";
const STORAGE_KEY = "senpai_notifications_v1";

export const DEFAULT_NOTIFICATIONS: SenpaiNotification[] = [
  {
    id: "wind-breaker-chapter-2",
    kind: "chapter",
    title: "New chapter available",
    detail: "Wind Breaker Chapter 2 is ready to read.",
    time: "Just now",
    href: "/manga/e142cdf8-3e59-4957-abf0-e924cf196cad",
    unread: true,
  },
  {
    id: "fresh-recommendations",
    kind: "recommendation",
    title: "Fresh recommendations",
    detail: "We found manga that match your recent reads.",
    time: "2 hours ago",
    href: "/discover",
    unread: true,
  },
  {
    id: "library-update",
    kind: "library",
    title: "Library update",
    detail: "One saved series changed its release status.",
    time: "Yesterday",
    href: "/library",
    unread: false,
  },
];

export function getNotifications(): SenpaiNotification[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_NOTIFICATIONS;

    const parsed = JSON.parse(stored) as SenpaiNotification[];
    if (!Array.isArray(parsed)) return DEFAULT_NOTIFICATIONS;

    const savedById = new Map(parsed.map((item) => [item.id, item]));
    return DEFAULT_NOTIFICATIONS.map((item) => ({
      ...item,
      unread: savedById.get(item.id)?.unread ?? item.unread,
    }));
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: SenpaiNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export function getUnreadNotificationCount() {
  return getNotifications().filter((item) => item.unread).length;
}
