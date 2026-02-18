export type ContactPlaceholder = {
  id: string;
  username: string;
  image: string;
  isOnline: boolean;
  lastSeen: string;
};

export const contactPlaceholders: ContactPlaceholder[] = [
  {
    id: "user_1",
    username: "alice_placeholder",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    isOnline: true,
    lastSeen: "Last seen 2m ago",
  },
  {
    id: "user_2",
    username: "bob_placeholder",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    isOnline: false,
    lastSeen: "Last seen 18m ago",
  },
  {
    id: "user_3",
    username: "charlie_placeholder",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    isOnline: false,
    lastSeen: "Last seen 1h ago",
  },
];
