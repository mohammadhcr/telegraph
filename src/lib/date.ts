export const formatMessageTime = (iso?: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatChatUpdatedAt = (iso?: string | null) => {
  if (!iso) return "Just now";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

export const formatLastSeen = (iso?: string | null) => {
  if (!iso) return "Offline";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Offline";
  return `Last seen ${formatChatUpdatedAt(iso)}`;
};
