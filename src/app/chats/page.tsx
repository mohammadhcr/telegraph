import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Telegraph | Chats",
};

const chatPlaceholders = [
  {
    id: "chat_1",
    name: "placeholder_user",
    lastMessage: "TODO: show latest message preview here",
    updatedAt: "Just now",
    unreadCount: 2,
  },
  {
    id: "chat_2",
    name: "second_placeholder",
    lastMessage: "TODO: show another message preview",
    updatedAt: "5m ago",
    unreadCount: 0,
  },
];

const Chats = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <AppShell>
      <main className="min-h-screen px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          <Card className="sticky top-0 z-20 border bg-background/95 py-3 backdrop-blur">
            <CardHeader className="gap-3 px-4 py-3">
              <CardTitle className="text-center text-xl">Chats</CardTitle>
              <Input placeholder="Search chats..." />
            </CardHeader>
          </Card>

          <div className="mt-3 space-y-3 pb-20">
            {chatPlaceholders.map((chat) => (
              <Link key={chat.id} href={`/chats/${chat.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarFallback>
                          {chat.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{chat.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-muted-foreground">
                        {chat.updatedAt}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-xs font-medium">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default Chats;
