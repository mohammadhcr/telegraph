"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCheck,
  Loader2,
  SendHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/scroll-area";
import {
  formatMessageTime,
  formatSmartDayLabel,
  getLocalDayKey,
} from "@/lib/date";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { FaCheck } from "react-icons/fa6";

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

const normalizeOutgoingMessage = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

export const ChatLive = ({
  initialChatId,
  initialMessages,
  currentUserId,
  recipientId,
}: ChatLiveProps) => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const composerHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [composerCanScroll, setComposerCanScroll] = useState(false);
  const [composerThumbTop, setComposerThumbTop] = useState(0);
  const [composerThumbHeight, setComposerThumbHeight] = useState(0);
  const [showComposerIndicator, setShowComposerIndicator] = useState(false);

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
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const next = payload.new as MessageItem;
          setMessages((prev) =>
            prev.map((item) =>
              item.id === next.id ? { ...item, ...next } : item,
            ),
          );
        },
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
    [messages],
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [sortedMessages.length]);

  const updateComposerSize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const computed = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(computed.lineHeight) || 20;
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
    const maxHeight = lineHeight * 5 + paddingTop + paddingBottom;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > nextHeight + 1 ? "auto" : "hidden";
  };

  const updateComposerIndicator = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { scrollTop, scrollHeight, clientHeight } = textarea;
    const hasOverflow = scrollHeight > clientHeight + 1;
    setComposerCanScroll(hasOverflow);

    if (!hasOverflow) {
      setComposerThumbTop(0);
      setComposerThumbHeight(0);
      setShowComposerIndicator(false);
      return;
    }

    const railHeight = clientHeight - 4;
    const nextThumbHeight = Math.max(
      14,
      Math.round((clientHeight / scrollHeight) * railHeight),
    );
    const maxOffset = Math.max(0, railHeight - nextThumbHeight);
    const progress =
      scrollHeight === clientHeight
        ? 0
        : scrollTop / (scrollHeight - clientHeight);

    setComposerThumbHeight(nextThumbHeight);
    setComposerThumbTop(Math.round(progress * maxOffset));
  };

  const revealComposerIndicator = () => {
    if (!composerCanScroll) return;
    setShowComposerIndicator(true);
    if (composerHideTimeoutRef.current) {
      clearTimeout(composerHideTimeoutRef.current);
    }
    composerHideTimeoutRef.current = setTimeout(() => {
      setShowComposerIndicator(false);
    }, 1200);
  };

  useEffect(() => {
    updateComposerSize();
    updateComposerIndicator();
  }, [message]);

  useEffect(() => {
    return () => {
      if (composerHideTimeoutRef.current) {
        clearTimeout(composerHideTimeoutRef.current);
      }
    };
  }, []);

  const submitMessage = async () => {
    const content = normalizeOutgoingMessage(message);
    if (!content.replace(/\s/g, "") || sending) return;

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
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.scrollTop = 0;
      }
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sending && message.trim()) {
        void submitMessage();
      }
    }
  };

  return (
    <>
      <div className="mx-auto flex h-[100dvh] w-full max-w-4xl flex-col px-4 py-4">
        <ScrollArea
          ref={scrollRef}
          className="min-h-0 flex-1"
          viewportClassName="pb-36 pt-20 pr-2 md:pb-20 md:pr-3"
        >
          <div className="flex min-h-full flex-col justify-end gap-3 pt-2 md:pt-3">
            {sortedMessages.length ? (
              sortedMessages.map((item, index) => {
                const dayKey = getLocalDayKey(item.created_at);
                const prevDayKey =
                  index > 0
                    ? getLocalDayKey(sortedMessages[index - 1]?.created_at)
                    : "";
                const showDaySeparator = dayKey && dayKey !== prevDayKey;

                return (
                  <div key={item.id}>
                    {showDaySeparator ? (
                      <div className="my-4 flex items-center justify-center">
                        <span className="rounded-full bg-white/10 px-4 py-1 text-xs text-muted-foreground">
                          {formatSmartDayLabel(item.created_at)}
                        </span>
                      </div>
                    ) : null}

                    <div
                      className={`flex ${item.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[82%]">
                        <div
                          className={`rounded-[22px] px-4 py-2 text-[14px] shadow-sm ${
                            item.sender_id === currentUserId
                              ? "rounded-br-md bg-sky-500 text-white"
                              : "rounded-bl-md bg-zinc-800 text-zinc-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {item.content}
                          </p>
                        </div>
                        <p
                          className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground justify-end`}
                        >
                          <span>{formatMessageTime(item.created_at)}</span>
                          {item.sender_id === currentUserId ? (
                            item.is_seen ? (
                              <FaCheck className="size-3 text-sky-400" />
                            ) : (
                              <FaCheck className="size-3" />
                            )
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="chat-composer fixed inset-x-0 z-40 md:bottom-3 md:left-[17.5rem]">
        <div className="mx-auto w-full max-w-4xl px-3 md:px-4">
          <form
            onSubmit={handleSend}
            className="apple-surface flex items-center gap-3 rounded-3xl px-3 py-2"
          >
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                onScroll={() => {
                  updateComposerIndicator();
                  revealComposerIndicator();
                }}
                placeholder="Message..."
                rows={1}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="send"
                autoComplete="off"
                className="no-native-scrollbar min-h-10 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
                disabled={sending}
              />
              {composerCanScroll && (
                <div
                  className={`pointer-events-none absolute inset-y-[6px] right-2 w-1 transition-opacity duration-300 ${
                    showComposerIndicator ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    className="absolute right-0 w-1 rounded-full bg-sky-400/40"
                    style={{
                      top: composerThumbTop,
                      height: composerThumbHeight,
                    }}
                  />
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-full"
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <SendHorizontal className="size-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
