import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ContactsList } from "@/components/contacts-list";
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
  const contactsView = contacts.map((contact) => ({
    id: contact.id,
    username: contact.username,
    email: contact.email,
    avatar: contact.avatar,
    statusLabel: contact.is_online ? "Online" : formatLastSeen(contact.last_seen),
  }));

  return (
    <AppShell>
      <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-3 md:h-[100dvh]">
        <ContactsList contacts={contactsView} />
      </main>
    </AppShell>
  );
};

export default ContactsPage;
