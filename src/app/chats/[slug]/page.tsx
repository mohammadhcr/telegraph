import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChatLive } from "@/components/chat-live";
import { BackLinkButton } from "@/components/back-link-button";
import {
  findChatBetweenUsers,
  getGroupChatById,
  getGroupMembers,
  getMessagesByChatId,
  getUserById,
  isUserMemberOfChat,
  isUserOnlineNow,
  markChatMessagesAsSeen,
  parseGroupSlug,
  syncUserFromClerk,
} from "@/lib/db";
import { formatLastSeen } from "@/lib/date";

export const metadata: Metadata = {
  title: "Telegraph | Chat",
};

type ChatPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ChatParticipant = {
  id: string;
  username: string;
  avatar: string | null;
  isOnline: boolean;
};

const ChatBySlugPage = async ({ params }: ChatPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  const syncedUser = clerkUser
    ? await syncUserFromClerk(clerkUser)
    : await getUserById(userId);

  const { slug } = await params;
  const groupChatId = parseGroupSlug(slug);

  if (groupChatId) {
    const group = await getGroupChatById(groupChatId);
    if (!group) {
      redirect("/chats");
    }

    const isMember = await isUserMemberOfChat(group.id, userId);
    if (!isMember) {
      redirect("/chats");
    }

    const members = await getGroupMembers(group.id);
    const messages = await getMessagesByChatId(group.id);
    await markChatMessagesAsSeen(group.id, userId);

    const participants: ChatParticipant[] = members.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      avatar: member.user.avatar,
      isOnline: isUserOnlineNow(member.user),
    }));

    const groupTitle = group.title?.trim() || "Untitled group";

    return (
      <main className="apple-page relative h-[100dvh] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 mx-4 my-3">
          <Card className="mx-auto w-full max-w-4xl py-0">
            <CardContent className="pointer-events-auto flex items-center gap-3 px-4 py-3">
              <BackLinkButton href="/chats" />
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center gap-3 truncate text-base font-semibold"
              >
                <Avatar className="size-10 ring-1 ring-white/15">
                  <AvatarImage src={group.avatar ?? undefined} alt={groupTitle} />
                  <AvatarFallback>
                    {groupTitle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  {groupTitle}
                  <p className="text-xs text-muted-foreground">
                    {members.length} members
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        <ChatLive
          chatType="group"
          initialChatId={group.id}
          initialMessages={messages}
          currentUserId={userId}
          recipientId={null}
          participants={participants}
        />
      </main>
    );
  }

  const contact = await getUserById(slug);
  if (!contact || contact.id === userId) {
    redirect("/chats");
  }

  const chat = await findChatBetweenUsers(userId, slug);
  const messages = chat ? await getMessagesByChatId(chat.id) : [];
  const isOnline = isUserOnlineNow(contact);

  if (chat) {
    await markChatMessagesAsSeen(chat.id, userId);
  }

  const participants: ChatParticipant[] = [
    ...(syncedUser
      ? [
          {
            id: syncedUser.id,
            username: syncedUser.username,
            avatar: syncedUser.avatar,
            isOnline: isUserOnlineNow(syncedUser),
          },
        ]
      : []),
    {
      id: contact.id,
      username: contact.username,
      avatar: contact.avatar,
      isOnline,
    },
  ];

  return (
    <main className="apple-page relative h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 mx-4 my-3">
        <Card className="mx-auto w-full max-w-4xl py-0">
          <CardContent className="pointer-events-auto flex items-center gap-3 px-4 py-3">
            <BackLinkButton href="/chats" />
            <Link
              href={`/contacts/${contact.id}`}
              className="flex items-center gap-3 truncate text-base font-semibold"
            >
              <Avatar className="size-10 ring-1 ring-white/15">
                <AvatarImage
                  src={contact.avatar ?? undefined}
                  alt={contact.username}
                />
                <AvatarFallback>
                  {contact.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
                {isOnline ? <AvatarBadge className="bg-emerald-500" /> : null}
              </Avatar>
              <div className="min-w-0">
                {contact.username}
                <p className="text-xs text-muted-foreground">
                  {isOnline ? "Online" : formatLastSeen(contact.last_seen)}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <ChatLive
        chatType="direct"
        initialChatId={chat?.id ?? null}
        initialMessages={messages}
        currentUserId={userId}
        recipientId={contact.id}
        participants={participants}
      />
    </main>
  );
};

export default ChatBySlugPage;
