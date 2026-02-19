import Link from "next/link";
import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getChatList, syncUserFromClerk } from "@/lib/db";
import { formatChatUpdatedAt } from "@/lib/date";

export const metadata: Metadata = {
  title: "Telegraph | Chats",
};

const ChatsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  }

  const chats = await getChatList(userId);

  return (
    <AppShell>
      <main className="apple-page px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          <Card className="sticky top-0 z-20 py-3">
            <CardHeader className="gap-3 px-4 py-3">
              <CardTitle className="text-center text-xl">Chats</CardTitle>
              <Input placeholder="Search chats..." />
            </CardHeader>
          </Card>

          <div className="mt-3 space-y-3 pb-20">
            {chats.length ? (
              chats.map((chat) => (
                <Link key={chat.chatId} href={`/chats/${chat.otherUser.id}`} className="block">
                  <Card className="transition-colors hover:bg-accent/40">
                    <CardContent className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-12">
                          <AvatarImage
                            src={chat.otherUser.avatar ?? undefined}
                            alt={chat.otherUser.username}
                          />
                          <AvatarFallback>
                            {chat.otherUser.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-medium">{chat.otherUser.username}</p>
                          <p className="truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatChatUpdatedAt(chat.updatedAt)}
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
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No chats yet. Start by opening a contact.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default ChatsPage;
