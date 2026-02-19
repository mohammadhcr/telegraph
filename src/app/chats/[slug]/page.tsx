import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChatLive } from "@/components/chat-live";
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
      <main className="apple-page h-[100dvh] overflow-hidden">
        <div className="sticky top-0 z-30 px-4 py-3">
          <Card className="mx-auto w-full max-w-4xl py-0">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <Button asChild size="icon" variant="ghost">
                <Link href="/chats">
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Back to chats</span>
                </Link>
              </Button>
              <Avatar className="size-10">
                <AvatarImage src={contact.avatar ?? undefined} alt={contact.username} />
                <AvatarFallback>{contact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{contact.username}</p>
                <p className="text-xs text-muted-foreground">
                  {contact.is_online ? "Online" : formatLastSeen(contact.last_seen)}
                </p>
              </div>
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
