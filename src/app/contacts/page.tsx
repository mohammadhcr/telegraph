import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ContactsList } from "@/components/contacts-list";
import { formatLastSeen } from "@/lib/date";
import { getContacts, isUserOnlineNow, syncUserFromClerk } from "@/lib/db";

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
  const contactsView = contacts.map((contact) => {
    const isOnline = isUserOnlineNow(contact);
    return {
    id: contact.id,
    username: contact.username,
    email: contact.email,
    avatar: contact.avatar,
    isOnline,
    statusLabel: isOnline ? "Online" : formatLastSeen(contact.last_seen),
  };
  });

  return (
    <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-4 md:h-[100dvh] md:px-5">
      <ContactsList contacts={contactsView} currentUserId={userId} />
    </main>
  );
};

export default ContactsPage;

