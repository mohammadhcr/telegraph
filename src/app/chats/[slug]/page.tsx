import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ensureChatBetweenUsers,
  findChatBetweenUsers,
  getMessagesByChatId,
  getUserById,
  markChatMessagesAsSeen,
  sendMessage,
  syncUserFromClerk,
} from "@/lib/db";
import { formatMessageTime, formatLastSeen } from "@/lib/date";

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

  const sendMessageAction = async (formData: FormData) => {
    "use server";

    const authState = await auth();
    if (!authState.userId) return;

    const message = String(formData.get("message") ?? "").trim();
    if (!message) return;

    const activeChat = await ensureChatBetweenUsers(authState.userId, slug);
    await sendMessage(activeChat.id, authState.userId, message);

    revalidatePath(`/chats/${slug}`);
    revalidatePath("/chats");
  };

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

        <div className="mx-auto flex h-[calc(100dvh-4.25rem)] w-full max-w-4xl flex-col px-4 py-4">
          <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto pb-44 md:pb-24">
            <div className="space-y-3 pt-10">
              {messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[82%]">
                      <div
                        className={`rounded-[22px] px-4 py-2 text-sm shadow-sm ${
                          message.sender_id === userId
                            ? "rounded-br-md bg-sky-500 text-white"
                            : "rounded-bl-md bg-zinc-800 text-zinc-100"
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      <p
                        className={`mt-1 px-1 text-[11px] text-muted-foreground ${
                          message.sender_id === userId ? "text-right" : "text-left"
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
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
            <form action={sendMessageAction} className="apple-surface flex items-center gap-3 rounded-3xl px-3 py-2">
              <Input
                name="message"
                placeholder="Message..."
                className="h-10 rounded-full border-white/10 bg-black/30"
              />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-full">
                <SendHorizontal className="size-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default ChatBySlugPage;
