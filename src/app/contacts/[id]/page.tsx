import type { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLastSeen } from "@/lib/date";
import { getUserById, isUserOnlineNow, syncUserFromClerk } from "@/lib/db";

export const metadata: Metadata = {
  title: "Telegraph | Contact Profile",
};

type ContactProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const ContactProfilePage = async ({ params }: ContactProfilePageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  }

  const { id } = await params;
  const contact = await getUserById(id);
  const isOnline = contact ? isUserOnlineNow(contact) : false;

  if (!contact || contact.id === userId) {
    redirect("/contacts");
  }

  return (
    <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-3 md:h-[100dvh]">
      <div className="no-native-scrollbar mx-auto flex h-full w-full max-w-2xl items-start justify-center overflow-y-auto overscroll-y-contain py-3 md:items-center">
        <Card className="w-full">
          <CardHeader className="items-center gap-3 px-6 py-4 text-center">
            <Avatar className="mx-auto size-32">
              <AvatarImage
                src={contact.avatar ?? undefined}
                alt={contact.username}
              />
              <AvatarFallback>
                {contact.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
              {isOnline ? (
                <AvatarBadge className="bg-emerald-500" />
              ) : null}
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{contact.username}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {isOnline ? "Online" : formatLastSeen(contact.last_seen)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Email</p>
              <span className="rounded-full border px-3 py-1 text-sm">
                {contact.email}
              </span>
            </div>

            <div className="flex items-center justify-center pt-1">
              <Button asChild>
                <Link href={`/chats/${contact.id}`}>Send message</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ContactProfilePage;

