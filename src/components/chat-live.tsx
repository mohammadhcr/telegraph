"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
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

type ChatRow = {
  id: string;
  user1_id: string | null;
  user2_id: string | null;
};

type ChatLiveProps = {
  chatType: "direct" | "group";
  initialChatId: string | null;
  initialMessages: MessageItem[];
  currentUserId: string;
  recipientId: string | null;
  participants: Array<{
    id: string;
    username: string;
    avatar: string | null;
    isOnline: boolean;
  }>;
};

type DayMessageGroup = {
  dayKey: string;
  dayLabel: string;
  items: MessageItem[];
};

const normalizeOutgoingMessage = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

export const ChatLive = ({
  chatType,
  initialChatId,
  initialMessages,
  currentUserId,
  recipientId,
  participants,
}: ChatLiveProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const markSeenCooldownRef = useRef(0);
  const cacheKeyRef = useRef("");
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
    setChatId(initialChatId);
  }, [initialChatId]);

  const participantsById = useMemo(
    () =>
      new Map(
        participants.map((participant) => [
          participant.id,
          {
            username: participant.username,
            avatar: participant.avatar,
          },
        ]),
      ),
    [participants],
  );

  const isNearBottom = () => {
    const viewport = scrollRef.current;
    if (!viewport) return true;
    const remaining =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    return remaining <= 72;
  };

  const canMarkSeenNow = () =>
    document.visibilityState === "visible" &&
    document.hasFocus() &&
    isNearBottom();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const currentCacheKey =
      chatId ??
      [currentUserId, recipientId]
        .filter((item): item is string => Boolean(item))
        .sort((a, b) => a.localeCompare(b))
        .join(":");
    cacheKeyRef.current = `telegraph:cache:messages:${currentCacheKey}`;

    if (initialMessages.length) return;

    try {
      const raw = window.localStorage.getItem(cacheKeyRef.current);
      if (!raw) return;
      const cached = JSON.parse(raw) as MessageItem[];
      if (Array.isArray(cached) && cached.length) {
        setMessages(cached);
      }
    } catch {
      // Ignore malformed cache data.
    }
  }, [chatId, currentUserId, initialMessages.length, recipientId]);

  useEffect(() => {
    if (!cacheKeyRef.current || !messages.length) return;
    try {
      window.localStorage.setItem(
        cacheKeyRef.current,
        JSON.stringify(messages.slice(-200)),
      );
    } catch {
      // Ignore storage quota errors.
    }
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;

    const markSeen = () => {
      if (!canMarkSeenNow()) return;
      const now = Date.now();
      if (now - markSeenCooldownRef.current < 1500) return;
      markSeenCooldownRef.current = now;
      fetch("/api/chats/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      }).catch(() => null);
    };

    markSeen();

    const onFocus = () => markSeen();
    const onVisibility = () => markSeen();
    const onScroll = () => markSeen();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    scrollRef.current?.addEventListener("scroll", onScroll);

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
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      scrollRef.current?.removeEventListener("scroll", onScroll);
      supabaseBrowser.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (chatId || chatType !== "direct" || !recipientId) return;

    const channel = supabaseBrowser
      .channel(`chat-bind:${currentUserId}:${recipientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        async (payload) => {
          const next = payload.new as ChatRow;
          const isTargetChat =
            (next.user1_id === currentUserId &&
              next.user2_id === recipientId) ||
            (next.user1_id === recipientId && next.user2_id === currentUserId);

          if (!isTargetChat) return;

          setChatId(next.id);

          const { data } = await supabaseBrowser
            .from("messages")
            .select("*")
            .eq("chat_id", next.id)
            .order("created_at", { ascending: true });

          const incoming = (data ?? []) as MessageItem[];
          if (!incoming.length) return;

          setMessages((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const merged = [...prev];
            for (const item of incoming) {
              if (seen.has(item.id)) continue;
              merged.push(item);
            }
            return merged;
          });
        },
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [chatId, chatType, currentUserId, recipientId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      }),
    [messages],
  );

  const dayGroups = useMemo(() => {
    const groups: DayMessageGroup[] = [];

    for (const item of sortedMessages) {
      const dayKey = getLocalDayKey(item.created_at) || "__unknown_day__";
      const dayLabel = formatSmartDayLabel(item.created_at);
      const lastGroup = groups[groups.length - 1];

      if (!lastGroup || lastGroup.dayKey !== dayKey) {
        groups.push({
          dayKey,
          dayLabel,
          items: [item],
        });
        continue;
      }

      lastGroup.items.push(item);
    }

    return groups;
  }, [sortedMessages]);

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
        body: JSON.stringify(
          chatType === "group" ? { chatId, content } : { recipientId, content },
        ),
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
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    await submitMessage();
  };

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
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
          viewportClassName="pb-20 pt-20 pr-2 md:pr-3"
        >
          <div className="flex min-h-full flex-col justify-end gap-3 pt-2 md:pt-3">
            {dayGroups.length ? (
              dayGroups.map((group) => (
                <div key={group.dayKey} className="relative">
                  <div className="sticky top-0 z-10 flex justify-center py-1.5">
                    <span className="rounded-full border border-white/12 bg-white/4 px-4 py-1 text-xs text-muted-foreground backdrop-blur-sm">
                      {group.dayLabel}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const participant = participantsById.get(item.sender_id);
                      const isMine = item.sender_id === currentUserId;

                      return (
                        <div key={item.id}>
                          <div
                            className={`flex ${isMine ? "justify-end" : "justify-start"} items-end`}
                          >
                            {!isMine ? (
                              <div className="mr-2 mb-5 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20">
                                {participant?.avatar ? (
                                  <img
                                    src={participant.avatar}
                                    alt={participant.username}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                                    {(participant?.username ?? "U").slice(0, 1)}
                                  </span>
                                )}
                              </div>
                            ) : null}
                            <div className="max-w-[82%]">
                              <div
                                className={`rounded-[22px] px-4 py-2 text-[14px] md:text-[15px] ${
                                  isMine
                                    ? "rounded-br-md bg-primary text-primary-foreground"
                                    : "rounded-bl-md bg-white/8 text-primary-foreground backdrop-blur-sm"
                                }`}
                              >
                                {!isMine ? (
                                  <p className="mb-1 text-[11px] font-semibold text-primary/90">
                                    {participant?.username ?? "Unknown"}
                                  </p>
                                ) : null}
                                <p className="whitespace-pre-wrap break-words">
                                  {item.content}
                                </p>
                              </div>
                              <p
                                className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground justify-end`}
                              >
                                <span>
                                  {formatMessageTime(item.created_at)}
                                </span>
                                {isMine ? (
                                  item.is_seen ? (
                                    <FaCheck className="size-3 text-primary" />
                                  ) : (
                                    <FaCheck className="size-3" />
                                  )
                                ) : null}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="chat-composer fixed inset-x-0 z-40 md:bottom-3 md:left-[19rem]">
        <div className="mx-auto mb-2 w-full max-w-4xl px-3 md:px-8">
          <div className="tg-surface flex items-end gap-4 border-none rounded-lg px-3 py-3">
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                name="chat-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                onScroll={() => {
                  updateComposerIndicator();
                  revealComposerIndicator();
                }}
                placeholder="Message"
                rows={1}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="enter"
                inputMode="text"
                aria-autocomplete="none"
                autoComplete="off"
                className="no-native-scrollbar min-h-10 w-full resize-none rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-[16px] leading-5 outline-none placeholder:text-muted-foreground backdrop-blur-sm"
                disabled={sending}
              />
              {composerCanScroll && (
                <div
                  className={`pointer-events-none absolute inset-y-[6px] right-2 w-1 transition-opacity duration-300 ${
                    showComposerIndicator ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    className="absolute right-0 w-1 rounded-full bg-primary/40"
                    style={{
                      top: composerThumbTop,
                      height: composerThumbHeight,
                    }}
                  />
                </div>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 rounded-full"
              disabled={sending}
              onClick={() => {
                void handleSend();
              }}
            >
              {sending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <SendHorizontal className="size-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
