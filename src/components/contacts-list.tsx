"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/scroll-area";

type ContactViewItem = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  statusLabel: string;
};

type ContactsListProps = {
  contacts: ContactViewItem[];
};

export const ContactsList = ({ contacts }: ContactsListProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;
    return contacts.filter(
      (contact) =>
        contact.username.toLowerCase().includes(normalized) ||
        contact.email.toLowerCase().includes(normalized)
    );
  }, [contacts, query]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <Card className="shrink-0 py-3">
        <CardHeader className="gap-3 px-4 py-3">
          <CardTitle className="text-center text-xl">Contacts</CardTitle>
          <Input
            placeholder="Search contacts..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </CardHeader>
      </Card>

      <ScrollArea className="mt-3 min-h-0 flex-1" viewportClassName="space-y-3 pb-3 pr-2 md:pr-3">
        {filtered.length ? (
          filtered.map((contact) => {
            const busy = pendingId === contact.id;
            return (
              <button
                key={contact.id}
                type="button"
                className="block w-full text-left"
                disabled={busy}
                onClick={() => {
                  if (busy) return;
                  setPendingId(contact.id);
                  router.push(`/contacts/${contact.id}`);
                }}
              >
              <Card className="transition-colors hover:bg-accent/40">
                <CardContent className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarImage src={contact.avatar ?? undefined} alt={contact.username} />
                    <AvatarFallback>{contact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium">{contact.username}</p>
                    <p className="text-xs text-muted-foreground">{contact.statusLabel}</p>
                  </div>
                  {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </CardContent>
              </Card>
              </button>
            );
          })
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
