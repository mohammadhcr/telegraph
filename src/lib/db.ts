import "server-only";
import { supabaseServer } from "@/lib/supabase-server";

type ClerkLikeUser = {
  id: string;
  username: string | null;
  imageUrl: string;
  emailAddresses: Array<{ emailAddress: string }>;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export type UserRow = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  is_online: boolean | null;
  last_seen: string | null;
  created_at: string | null;
};

export type ChatRow = {
  id: string;
  user1_id: string;
  user2_id: string;
};

export type MessageRow = {
  id: string;
  chat_id: string | null;
  sender_id: string;
  content: string;
  created_at: string | null;
  is_seen: boolean | null;
};

const fallbackUsername = (userId: string) => `user_${userId.slice(-8)}`;

export const syncUserFromClerk = async (clerkUser: ClerkLikeUser) => {
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("No email address found for current user.");
  }

  const username = clerkUser.username ?? fallbackUsername(clerkUser.id);
  const now = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from("users")
    .upsert(
      {
        id: clerkUser.id,
        username,
        email,
        avatar: clerkUser.imageUrl,
        is_online: true,
        last_seen: now,
        created_at: now,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single<UserRow>();

  if (error) throw error;
  return data;
};

export const setUserOffline = async (userId: string) => {
  const { error } = await supabaseServer
    .from("users")
    .update({
      is_online: false,
      last_seen: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle<UserRow>();

  if (error) throw error;
  return data;
};

export const getContacts = async (currentUserId: string) => {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .neq("id", currentUserId)
    .order("is_online", { ascending: false })
    .order("last_seen", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as UserRow[];
};

export const findChatBetweenUsers = async (currentUserId: string, otherUserId: string) => {
  const { data, error } = await supabaseServer
    .from("chats")
    .select("*")
    .or(
      `and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`
    )
    .maybeSingle<ChatRow>();

  if (error) throw error;
  return data;
};

export const ensureChatBetweenUsers = async (currentUserId: string, otherUserId: string) => {
  const existing = await findChatBetweenUsers(currentUserId, otherUserId);
  if (existing) return existing;

  const { data, error } = await supabaseServer
    .from("chats")
    .insert({
      user1_id: currentUserId,
      user2_id: otherUserId,
    })
    .select("*")
    .single<ChatRow>();

  if (error) throw error;
  return data;
};

export const getMessagesByChatId = async (chatId: string) => {
  const { data, error } = await supabaseServer
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
};

export const markChatMessagesAsSeen = async (chatId: string, viewerId: string) => {
  const { error } = await supabaseServer
    .from("messages")
    .update({ is_seen: true })
    .eq("chat_id", chatId)
    .neq("sender_id", viewerId)
    .eq("is_seen", false);

  if (error) throw error;
};

export const sendMessage = async (chatId: string, senderId: string, content: string) => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const { data, error } = await supabaseServer
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content: trimmed,
      created_at: new Date().toISOString(),
      is_seen: false,
    })
    .select("*")
    .single<MessageRow>();

  if (error) throw error;
  return data;
};

export type ChatListItem = {
  chatId: string;
  otherUser: UserRow;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
};

export const getChatList = async (currentUserId: string): Promise<ChatListItem[]> => {
  const { data: chatsData, error: chatsError } = await supabaseServer
    .from("chats")
    .select("*")
    .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

  if (chatsError) throw chatsError;
  const chats = (chatsData ?? []) as ChatRow[];
  if (!chats.length) return [];

  const otherUserIds = Array.from(
    new Set(
      chats.map((chat) =>
        chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id
      )
    )
  );

  const { data: usersData, error: usersError } = await supabaseServer
    .from("users")
    .select("*")
    .in("id", otherUserIds);

  if (usersError) throw usersError;
  const users = (usersData ?? []) as UserRow[];
  const usersById = new Map(users.map((user) => [user.id, user]));

  const chatIds = chats.map((chat) => chat.id);

  const { data: messagesData, error: messagesError } = await supabaseServer
    .from("messages")
    .select("*")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;
  const messages = (messagesData ?? []) as MessageRow[];

  const latestMessageByChat = new Map<string, MessageRow>();
  const unreadCountByChat = new Map<string, number>();

  for (const message of messages) {
    const chatId = message.chat_id;
    if (!chatId) continue;

    if (!latestMessageByChat.has(chatId)) {
      latestMessageByChat.set(chatId, message);
    }

    if (message.sender_id !== currentUserId && !message.is_seen) {
      unreadCountByChat.set(chatId, (unreadCountByChat.get(chatId) ?? 0) + 1);
    }
  }

  return chats
    .map((chat) => {
      const otherUserId =
        chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;
      const otherUser = usersById.get(otherUserId);
      if (!otherUser) return null;

      const latest = latestMessageByChat.get(chat.id);

      return {
        chatId: chat.id,
        otherUser,
        lastMessage: latest?.content ?? "No messages yet.",
        updatedAt: latest?.created_at ?? "",
        unreadCount: unreadCountByChat.get(chat.id) ?? 0,
      } satisfies ChatListItem;
    })
    .filter((item): item is ChatListItem => item !== null);
};
