import type { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatLastSeen } from "@/lib/date";
import { getContacts, syncUserFromClerk } from "@/lib/db";

export const metadata: Metadata = {
  title: "Telegraph | Contacts",
};

const ContactsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  }

  const contacts = await getContacts(userId);

  return (
    <AppShell>
      <main className="apple-page px-4 py-3">
        <div className="mx-auto w-full max-w-3xl">
          <Card className="sticky top-0 z-20 py-3">
            <CardHeader className="gap-3 px-4 py-3">
              <CardTitle className="text-center text-xl">Contacts</CardTitle>
              <Input placeholder="Search contacts..." />
            </CardHeader>
          </Card>

          <div className="mt-3 space-y-3 pb-20">
            {contacts.length ? (
              contacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`} className="block">
                  <Card className="transition-colors hover:bg-accent/40">
                    <CardContent className="flex items-center gap-4">
                      <Avatar className="size-12">
                        <AvatarImage src={contact.avatar ?? undefined} alt={contact.username} />
                        <AvatarFallback>{contact.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{contact.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {contact.is_online ? "Online" : formatLastSeen(contact.last_seen)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No contacts found.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default ContactsPage;
