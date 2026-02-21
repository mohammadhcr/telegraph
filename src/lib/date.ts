const DAY_MS = 24 * 60 * 60 * 1000;

const toValidDate = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getStartOfLocalDayMs = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const getLocalDayKey = (iso?: string | null) => {
  const date = toValidDate(iso);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatSmartDayLabel = (
  iso?: string | null,
  options?: {
    todayLabel?: string;
    yesterdayLabel?: string;
    locale?: Intl.LocalesArgument;
  },
) => {
  const date = toValidDate(iso);
  if (!date) return "";

  const todayLabel = options?.todayLabel ?? "Today";
  const yesterdayLabel = options?.yesterdayLabel ?? "Yesterday";
  const locale = options?.locale;
  const dayDiff = Math.round(
    (getStartOfLocalDayMs(new Date()) - getStartOfLocalDayMs(date)) / DAY_MS,
  );

  if (dayDiff === 0) return todayLabel;
  if (dayDiff === 1) return yesterdayLabel;

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatMessageTime = (iso?: string | null) => {
  const date = toValidDate(iso);
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatChatUpdatedAt = (iso?: string | null) => {
  const date = toValidDate(iso);
  if (!date) return "Just now";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return formatSmartDayLabel(iso);
};

export const formatLastSeen = (iso?: string | null) => {
  const date = toValidDate(iso);
  if (!date) return "Offline";
  return `Last seen ${formatChatUpdatedAt(iso)}`;
};
