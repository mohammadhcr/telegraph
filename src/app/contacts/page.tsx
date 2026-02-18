import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { contactPlaceholders } from "@/lib/contact-placeholders";

export const metadata: Metadata = {
  title: "Telegraph | Contacts",
};

const ContactsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  return (
    <AppShell>
      <main className="min-h-screen px-4 py-3">
        <div className="mx-auto w-full max-w-3xl">
          <Card className="sticky top-0 z-20 border bg-background/95 py-3 backdrop-blur">
            <CardHeader className="gap-3 px-4 py-3">
              <CardTitle className="text-center text-xl">Contacts</CardTitle>
              <Input placeholder="Search contacts..." />
            </CardHeader>
          </Card>

          <div className="mt-3 space-y-3 pb-20">
            {contactPlaceholders.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex items-center gap-4">
                    <Avatar className="size-12">
                      <AvatarImage src={contact.image} alt={contact.username} />
                      <AvatarFallback>
                        {contact.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{contact.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {contact.isOnline ? "Online" : contact.lastSeen}
                      </p>
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

export default ContactsPage;
