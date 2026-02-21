"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/scroll-area";

type ChatViewItem = {
  chatId: string;
  userId: string;
  username: string;
  avatar: string | null;
  lastMessage: string;
  updatedAt: string;
  updatedAtLabel: string;
  unreadCount: number;
};

type ChatsListProps = {
  chats: ChatViewItem[];
};

export const ChatsList = ({ chats }: ChatsListProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const sortedChats = [...chats].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    const normalized = query.trim().toLowerCase();
    if (!normalized) return sortedChats;
    return sortedChats.filter(
      (chat) =>
        chat.username.toLowerCase().includes(normalized) ||
        chat.lastMessage.toLowerCase().includes(normalized),
    );
  }, [chats, query]);

  const openChat = (userId: string) => {
    setPendingId(userId);
    startTransition(() => {
      router.push(`/chats/${userId}`);
    });
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <Card className="shrink-0 py-3">
        <CardHeader className="gap-3 px-4 py-3">
          <CardTitle className="text-center text-xl">Chats</CardTitle>
          <Input
            placeholder="Search chats..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </CardHeader>
      </Card>

      <ScrollArea
        className="mt-3 min-h-0 flex-1"
        viewportClassName="pb-3 pr-2 md:pr-3"
      >
        {filtered.length ? (
          <Card className="gap-0 overflow-hidden py-0">
            {filtered.map((chat, index) => {
              const busy =
                (isPending && pendingId === chat.userId) ||
                pendingId === chat.userId;
              const isFirst = index === 0;
              const isLast = index === filtered.length - 1;

              return (
                <button
                  key={chat.chatId}
                  type="button"
                  className={`block w-full border-b border-white/10 text-left transition-colors hover:bg-accent/40 ${
                    isFirst ? "rounded-t-2xl" : ""
                  } ${isLast ? "rounded-b-2xl border-b-0" : ""}`}
                  disabled={busy}
                  onClick={() => openChat(chat.userId)}
                >
                  <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="size-12">
                        <AvatarImage
                          src={chat.avatar ?? undefined}
                          alt={chat.username}
                        />
                        <AvatarFallback>
                          {chat.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{chat.username}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {busy ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {chat.updatedAtLabel}
                        </p>
                      )}
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-xs font-medium">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </button>
              );
            })}
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {query
                ? "No results found."
                : "No chats yet. Start by opening a contact."}
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
};
