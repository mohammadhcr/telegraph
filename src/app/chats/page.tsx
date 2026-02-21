import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChatsList } from "@/components/chats-list";
import { getChatList, syncUserFromClerk } from "@/lib/db";
import { formatChatUpdatedAt } from "@/lib/date";

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
  const chatsView = chats.map((chat) => ({
    chatId: chat.chatId,
    userId: chat.otherUser.id,
    username: chat.otherUser.username,
    avatar: chat.otherUser.avatar,
    lastMessage: chat.lastMessage,
    updatedAt: chat.updatedAt,
    updatedAtLabel: formatChatUpdatedAt(chat.updatedAt),
    unreadCount: chat.unreadCount,
  }));

  return (
    <AppShell>
      <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-3 md:h-[100dvh]">
        <ChatsList chats={chatsView} />
      </main>
    </AppShell>
  );
};

export default ChatsPage;
