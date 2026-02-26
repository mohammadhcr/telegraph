import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatsList } from "@/components/chats-list";
import { getChatList, getContacts, isUserOnlineNow, syncUserFromClerk } from "@/lib/db";
import { formatChatUpdatedAt, formatLastSeen } from "@/lib/date";

export const metadata: Metadata = {
  title: "Telegraph | Chats",
};

const ChatsPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  }

  const chats = await getChatList(userId);
  const contacts = await getContacts(userId);
  const chatsView = chats.map((chat) => ({
    chatId: chat.chatId,
    slug: chat.slug,
    chatType: chat.chatType,
    title: chat.title?.trim() || (chat.chatType === "group" ? "Untitled group" : "Unknown user"),
    avatar: chat.avatar,
    isOnline: chat.isOnline,
    memberCount: chat.memberCount,
    lastMessage: chat.lastMessage || "No messages yet.",
    updatedAt: chat.updatedAt,
    updatedAtLabel: formatChatUpdatedAt(chat.updatedAt),
    unreadCount: chat.unreadCount,
  }));
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
      <ChatsList chats={chatsView} contacts={contactsView} currentUserId={userId} />
    </main>
  );
};

export default ChatsPage;
