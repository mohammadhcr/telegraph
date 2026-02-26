"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UsersRound, UserPlus, X } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/scroll-area";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ChatViewItem = {
  chatId: string;
  slug: string;
  chatType: "direct" | "group";
  title: string;
  avatar: string | null;
  isOnline: boolean;
  memberCount: number | null;
  lastMessage: string;
  updatedAt: string;
  updatedAtLabel: string;
  unreadCount: number;
};

type ChatsListProps = {
  chats: ChatViewItem[];
  contacts: Array<{
    id: string;
    username: string;
    email: string;
    avatar: string | null;
    isOnline: boolean;
    statusLabel: string;
  }>;
  currentUserId: string;
};

const normalizeChatViewItem = (chat: ChatViewItem): ChatViewItem => ({
  ...chat,
  title:
    chat.title?.trim() ||
    (chat.chatType === "group" ? "Untitled group" : "Unknown user"),
  lastMessage: chat.lastMessage || "No messages yet.",
});

export const ChatsList = ({
  chats,
  contacts,
  currentUserId,
}: ChatsListProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<"menu" | "group" | "contact">(
    "menu",
  );
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [contactUsername, setContactUsername] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [createError, setCreateError] = useState("");
  const [localChats, setLocalChats] = useState<ChatViewItem[]>(
    chats.map(normalizeChatViewItem),
  );
  const storageKey = `telegraph:cache:chats:${currentUserId}`;

  useEffect(() => {
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastRefreshAt = 0;
    const refreshList = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshAt < 2500) return;
      lastRefreshAt = now;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => router.refresh(), 200);
    };

    const channel = supabaseBrowser
      .channel(`chats-list:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        refreshList,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        refreshList,
      )
      .subscribe();

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      supabaseBrowser.removeChannel(channel);
    };
  }, [currentUserId, router]);

  useEffect(() => {
    const normalized = chats.map(normalizeChatViewItem);
    setLocalChats(normalized);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(normalized));
    } catch {
      // Ignore storage errors.
    }
  }, [chats, storageKey]);

  useEffect(() => {
    try {
      if (navigator.onLine) return;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const cached = JSON.parse(raw) as ChatViewItem[];
      if (Array.isArray(cached) && cached.length) {
        setLocalChats(cached.map(normalizeChatViewItem));
      }
    } catch {
      // Ignore malformed cache.
    }
  }, [storageKey]);

  const filtered = useMemo(() => {
    const sortedChats = [...localChats].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    const normalized = query.trim().toLowerCase();
    if (!normalized) return sortedChats;
    return sortedChats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(normalized) ||
        chat.lastMessage.toLowerCase().includes(normalized),
    );
  }, [localChats, query]);

  const openChat = (slug: string) => {
    setPendingId(slug);
    startTransition(() => {
      router.push(`/chats/${slug}`);
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateStep("menu");
    setGroupTitle("");
    setGroupMembers([]);
    setContactUsername("");
    setCreateError("");
  };

  const toggleGroupMember = (memberId: string) => {
    setGroupMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((item) => item !== memberId)
        : [...prev, memberId],
    );
  };

  const createGroup = async () => {
    if (!groupMembers.length || creatingGroup) return;
    setCreatingGroup(true);
    setCreateError("");
    try {
      const response = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: groupTitle,
          memberIds: groupMembers,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create group.");
      }
      closeCreateModal();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create group.";
      setCreateError(message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const addContact = async () => {
    if (!contactUsername.trim() || addingContact) return;
    setAddingContact(true);
    setCreateError("");
    try {
      const response = await fetch("/api/contacts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: contactUsername }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to add contact.");
      }
      closeCreateModal();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add contact.";
      setCreateError(message);
    } finally {
      setAddingContact(false);
    }
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <Card className="shrink-0 py-3">
        <CardHeader className="gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[1.25rem] tracking-tight">
              Chats
            </CardTitle>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-400"
            >
              <Plus className="size-3.5" />
              New
            </button>
          </div>
          <Input
            placeholder="Search chats..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11"
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
                (isPending && pendingId === chat.slug) ||
                pendingId === chat.slug;
              const isFirst = index === 0;
              const isLast = index === filtered.length - 1;

              return (
                <button
                  key={chat.chatId}
                  type="button"
                  className={`block w-full border-b border-white/10 text-left transition-colors bg-white/4 hover:bg-white/8 ${
                    isFirst ? "rounded-t-xl" : ""
                  } ${isLast ? "rounded-b-xl border-b-0" : ""}`}
                  disabled={busy}
                  onClick={() => openChat(chat.slug)}
                >
                  <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="size-12 ring-1 ring-white/20">
                        {chat.isOnline ? (
                          <AvatarBadge className="bg-emerald-500" />
                        ) : null}
                        <AvatarImage
                          src={chat.avatar ?? undefined}
                          alt={chat.title}
                        />
                        <AvatarFallback>
                          {chat.title.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[15px] font-medium">
                          {chat.title}
                        </p>
                        {chat.isOnline ? (
                          <p className="truncate text-[11px] text-muted-foreground">
                            Online
                          </p>
                        ) : null}
                        <p className="truncate text-[12px] text-muted-foreground">
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
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
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

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-xl rounded-lg border border-white/12 bg-black/70 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Create new</p>
                <p className="text-xs text-muted-foreground">
                  Choose what you want to add.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={closeCreateModal}
              >
                <X className="size-4" />
              </Button>
            </div>

            {createStep === "menu" ? (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setCreateStep("contact")}
                  className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 py-3 text-sm transition-colors hover:bg-white/10"
                >
                  <UserPlus className="size-4" />
                  New contact
                </button>
                <button
                  type="button"
                  onClick={() => setCreateStep("group")}
                  className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-3 py-3 text-sm transition-colors hover:bg-white/10"
                >
                  <UsersRound className="size-4" />
                  New group
                </button>
              </div>
            ) : null}

            {createStep === "contact" ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Username</p>
                <div className="space-y-2">
                  <Input
                    value={contactUsername}
                    onChange={(event) => setContactUsername(event.target.value)}
                    placeholder="@username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter the exact username of the user you want to add.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateStep("menu");
                      setCreateError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={!contactUsername.trim() || addingContact}
                    onClick={() => {
                      void addContact();
                    }}
                  >
                    {addingContact ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Add contact
                  </Button>
                </div>
              </div>
            ) : null}

            {createStep === "group" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Group name</p>
                  <Input
                    value={groupTitle}
                    onChange={(event) => setGroupTitle(event.target.value)}
                    placeholder="Team, Family, Project..."
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Members</p>
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10">
                    {contacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={groupMembers.includes(contact.id)}
                          onChange={() => toggleGroupMember(contact.id)}
                          className="size-4 accent-primary"
                        />
                        <Avatar className="size-9 ring-1 ring-white/20">
                          <AvatarImage
                            src={contact.avatar ?? undefined}
                            alt={contact.username}
                          />
                          <AvatarFallback>
                            {contact.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {contact.username}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateStep("menu");
                      setCreateError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={!groupMembers.length || creatingGroup}
                    onClick={() => {
                      void createGroup();
                    }}
                  >
                    {creatingGroup ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Create group
                  </Button>
                </div>
              </div>
            ) : null}

            {createError ? (
              <p className="mt-3 text-xs text-destructive">{createError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
