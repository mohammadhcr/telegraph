import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChatLive } from "@/components/chat-live";
import { BackLinkButton } from "@/components/back-link-button";
import {
  findChatBetweenUsers,
  getMessagesByChatId,
  getUserById,
  markChatMessagesAsSeen,
  syncUserFromClerk,
} from "@/lib/db";
import { formatLastSeen } from "@/lib/date";

export const metadata: Metadata = {
  title: "Telegraph | Chat",
};

type ChatPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const ChatBySlugPage = async ({ params }: ChatPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  }

  const { slug } = await params;
  const contact = await getUserById(slug);

  if (!contact || contact.id === userId) {
    redirect("/chats");
  }

  const chat = await findChatBetweenUsers(userId, slug);
  const messages = chat ? await getMessagesByChatId(chat.id) : [];

  if (chat) {
    await markChatMessagesAsSeen(chat.id, userId);
  }

  return (
    <AppShell>
      <main className="apple-page relative h-[100dvh] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 mx-4 my-3">
          <Card className="mx-auto w-full max-w-4xl py-0">
            <CardContent className="pointer-events-auto flex items-center gap-3 px-4 py-3">
              <BackLinkButton href="/chats" />
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-3 truncate text-base font-semibold hover:underline"
              >
                <Avatar className="size-10">
                  <AvatarImage
                    src={contact.avatar ?? undefined}
                    alt={contact.username}
                  />
                  <AvatarFallback>
                    {contact.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  {contact.username}
                  <p className="text-xs text-muted-foreground">
                    {contact.is_online
                      ? "Online"
                      : formatLastSeen(contact.last_seen)}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        <ChatLive
          initialChatId={chat?.id ?? null}
          initialMessages={messages}
          currentUserId={userId}
          recipientId={contact.id}
        />
      </main>
    </AppShell>
  );
};

export default ChatBySlugPage;
