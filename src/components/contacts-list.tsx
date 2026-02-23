"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/scroll-area";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ContactViewItem = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  statusLabel: string;
};

type ContactsListProps = {
  contacts: ContactViewItem[];
  currentUserId: string;
};

export const ContactsList = ({ contacts, currentUserId }: ContactsListProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [localContacts, setLocalContacts] = useState<ContactViewItem[]>(contacts);
  const storageKey = `telegraph:cache:contacts:${currentUserId}`;

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
      .channel(`contacts-list:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        refreshList,
      )
      .subscribe();

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      supabaseBrowser.removeChannel(channel);
    };
  }, [currentUserId, router]);

  useEffect(() => {
    setLocalContacts(contacts);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(contacts));
    } catch {
      // Ignore storage errors.
    }
  }, [contacts, storageKey]);

  useEffect(() => {
    try {
      if (navigator.onLine) return;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const cached = JSON.parse(raw) as ContactViewItem[];
      if (Array.isArray(cached) && cached.length) {
        setLocalContacts(cached);
      }
    } catch {
      // Ignore malformed cache.
    }
  }, [storageKey]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return localContacts;
    return localContacts.filter(
      (contact) =>
        contact.username.toLowerCase().includes(normalized) ||
        contact.email.toLowerCase().includes(normalized)
    );
  }, [localContacts, query]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <Card className="shrink-0 py-3">
        <CardHeader className="gap-3 px-4 py-3">
          <CardTitle className="text-center text-[1.25rem] tracking-tight">
            Contacts
          </CardTitle>
          <Input
            placeholder="Search contacts..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11"
          />
        </CardHeader>
      </Card>

      <ScrollArea className="mt-3 min-h-0 flex-1" viewportClassName="space-y-3 pb-3 pr-2 md:pr-3">
        {filtered.length ? (
          <Card className="gap-0 overflow-hidden py-0">
            {filtered.map((contact, index) => {
              const busy = pendingId === contact.id;
              const isFirst = index === 0;
              const isLast = index === filtered.length - 1;

              return (
                <button
                  key={contact.id}
                  type="button"
                  className={`block w-full border-b border-white/10 text-left transition-colors bg-white/4 hover:bg-white/8 ${
                    isFirst ? "rounded-t-xl" : ""
                  } ${isLast ? "rounded-b-xl border-b-0" : ""}`}
                  disabled={busy}
                  onClick={() => {
                    if (busy) return;
                    setPendingId(contact.id);
                    router.push(`/contacts/${contact.id}`);
                  }}
                >
                  <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="size-12 ring-1 ring-white/20">
                        <AvatarImage
                          src={contact.avatar ?? undefined}
                          alt={contact.username}
                        />
                        <AvatarFallback>
                          {contact.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                        {contact.isOnline ? (
                          <AvatarBadge className="bg-emerald-500" />
                        ) : null}
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-[15px] font-medium">
                          {contact.username}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {contact.statusLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {busy ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  </CardContent>
                </button>
              );
            })}
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {query ? "No results found." : "No contacts found."}
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
};


