import type { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLastSeen } from "@/lib/date";
import { getUserById, syncUserFromClerk } from "@/lib/db";

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

  if (!contact || contact.id === userId) {
    redirect("/contacts");
  }

  return (
    <AppShell>
      <main className="apple-page flex items-center justify-center px-4 py-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="items-center gap-3 px-6 py-4 text-center">
            <Avatar className="mx-auto size-32">
              <AvatarImage src={contact.avatar ?? undefined} alt={contact.username} />
              <AvatarFallback>{contact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{contact.username}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {contact.is_online ? "Online" : formatLastSeen(contact.last_seen)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center px-6">
            <Button asChild>
              <Link href={`/chats/${contact.id}`}>Send message</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
};

export default ContactProfilePage;
