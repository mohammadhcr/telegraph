import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { contactPlaceholders } from "@/lib/contact-placeholders";

export const metadata: Metadata = {
  title: "Telegraph | Chat",
};

type ChatPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const messagePlaceholders = [
  {
    id: "msg_1",
    sender: "other",
    text: "Can you send me the files by noon?",
    timestamp: "10:12",
  },
  {
    id: "msg_2",
    sender: "me",
    text: "Sure, I will send them in about 30 minutes.",
    timestamp: "10:13",
  },
];

const ChatBySlugPage = async ({ params }: ChatPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const { slug } = await params;
  const contact = contactPlaceholders.find((item) => item.id === slug) ?? {
    id: slug,
    username: "placeholder_contact",
    image: "",
    isOnline: true,
    lastSeen: "Last seen recently",
  };

  return (
    <AppShell>
      <main className="h-[100dvh] px-4 py-3">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-3 pb-16 md:pb-4">
          <Card className="sticky top-0 z-20 border bg-background/95 py-3 backdrop-blur">
            <CardHeader className="px-4">
              <div className="flex items-center gap-3">
                <Button asChild size="icon" variant="ghost">
                  <Link href="/chats">
                    <ArrowLeft className="size-4" />
                    <span className="sr-only">Back to chats</span>
                  </Link>
                </Button>
                <Avatar className="size-10">
                  <AvatarFallback>
                    {contact.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">
                    {contact.username}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {contact.isOnline ? "Online" : contact.lastSeen}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="min-h-0 flex-1">
            <CardContent className="h-full space-y-4 overflow-y-auto p-4">
              {messagePlaceholders.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.sender === "me"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border bg-card"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p
                      className={`mt-1 text-right text-[11px] ${
                        message.sender === "me"
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <Input placeholder="Type your message..." />
              <Button size="icon">
                <SendHorizontal className="size-5" />
                <span className="sr-only">Send</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
};

export default ChatBySlugPage;
