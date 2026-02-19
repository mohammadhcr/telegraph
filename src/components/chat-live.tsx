"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseBrowser } from "@/lib/supabase-browser";

type MessageItem = {
  id: string;
  chat_id: string | null;
  sender_id: string;
  content: string;
  created_at: string | null;
  is_seen: boolean | null;
};

type ChatLiveProps = {
  initialChatId: string | null;
  initialMessages: MessageItem[];
  currentUserId: string;
  recipientId: string;
};

const formatLocalTime = (iso?: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const ChatLive = ({
  initialChatId,
  initialMessages,
  currentUserId,
  recipientId,
}: ChatLiveProps) => {
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!chatId) return;

    const markSeen = () => {
      fetch("/api/chats/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      }).catch(() => null);
    };

    markSeen();

    const channel = supabaseBrowser
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const next = payload.new as MessageItem;
          setMessages((prev) => {
            if (prev.some((item) => item.id === next.id)) return prev;
            return [...prev, next];
          });

          if (next.sender_id !== currentUserId) {
            markSeen();
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      }),
    [messages]
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/chats/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const payload = (await response.json()) as {
        chatId?: string;
        message?: MessageItem | null;
      };

      if (payload.chatId) {
        setChatId(payload.chatId);
      }

      const sentMessage = payload.message;
      if (sentMessage) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
      }

      setMessage("");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex h-[calc(100dvh-4.25rem)] w-full max-w-4xl flex-col px-4 py-4">
        <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto pb-44 md:pb-24">
          <div className="space-y-3 pt-10">
            {sortedMessages.length ? (
              sortedMessages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[82%]">
                    <div
                      className={`rounded-[22px] px-4 py-2 text-sm shadow-sm ${
                        item.sender_id === currentUserId
                          ? "rounded-br-md bg-sky-500 text-white"
                          : "rounded-bl-md bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <p>{item.content}</p>
                    </div>
                    <p
                      className={`mt-1 px-1 text-[11px] text-muted-foreground ${
                        item.sender_id === currentUserId ? "text-right" : "text-left"
                      }`}
                    >
                      {formatLocalTime(item.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[5.5rem] z-40 md:bottom-3 md:left-[17.5rem]">
        <div className="mx-auto w-full max-w-4xl px-3 md:px-4">
          <form
            onSubmit={handleSend}
            className="apple-surface flex items-center gap-3 rounded-3xl px-3 py-2"
          >
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message..."
              className="h-10 rounded-full border-white/10 bg-black/30"
              disabled={sending}
            />
            <Button type="submit" size="icon" className="h-10 w-10 rounded-full" disabled={sending}>
              {sending ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
