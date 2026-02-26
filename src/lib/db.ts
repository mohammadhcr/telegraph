import "server-only";
import { unstable_cache } from "next/cache";
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
  user1_id: string | null;
  user2_id: string | null;
  chat_type: "direct" | "group";
  title: string | null;
  bio: string | null;
  avatar: string | null;
  created_by: string | null;
  created_at: string | null;
};

export type MessageRow = {
  id: string;
  chat_id: string | null;
  sender_id: string;
  content: string;
  created_at: string | null;
  is_seen: boolean | null;
};

export type ChatMemberRole = "admin" | "member";

type ChatMemberRow = {
  chat_id: string;
  user_id: string;
  role: ChatMemberRole;
  joined_at: string | null;
};

type ContactRow = {
  owner_id: string;
  contact_id: string;
  created_at: string | null;
};

type MessageReadRow = {
  message_id: string;
  user_id: string;
  seen_at: string | null;
};

export type GroupMemberProfile = {
  user: UserRow;
  role: ChatMemberRole;
  joined_at: string | null;
};

const fallbackUsername = (userId: string) => `user_${userId.slice(-8)}`;
const ONLINE_TTL_MS = 90_000;
const normalizeMessageContent = (value: string) =>
  value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
const normalizeGroupName = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeGroupBio = (value: string) =>
  value.replace(/\r\n/g, "\n").trim().replace(/\n{3,}/g, "\n\n");

export const GROUP_SLUG_PREFIX = "group-";
export const toGroupSlug = (chatId: string) => `${GROUP_SLUG_PREFIX}${chatId}`;
export const parseGroupSlug = (slug: string) =>
  slug.startsWith(GROUP_SLUG_PREFIX) ? slug.slice(GROUP_SLUG_PREFIX.length) : null;

export const isUserOnlineNow = (user: Pick<UserRow, "is_online" | "last_seen">) => {
  if (!user.is_online || !user.last_seen) return false;
  const lastSeen = new Date(user.last_seen).getTime();
  if (Number.isNaN(lastSeen)) return false;
  return Date.now() - lastSeen <= ONLINE_TTL_MS;
};

export const syncUserFromClerk = async (clerkUser: ClerkLikeUser) => {
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("No email address found for current user.");
  }

  const username = clerkUser.username ?? fallbackUsername(clerkUser.id);
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabaseServer
    .from("users")
    .select("*")
    .eq("id", clerkUser.id)
    .maybeSingle<UserRow>();

  if (existingError) throw existingError;

  if (!existing) {
    const { data, error } = await supabaseServer
      .from("users")
      .insert({
        id: clerkUser.id,
        username,
        email,
        avatar: clerkUser.imageUrl,
        is_online: true,
        last_seen: now,
        created_at: now,
      })
      .select("*")
      .single<UserRow>();

    if (error) throw error;
    return data;
  }

  const profileChanged =
    existing.username !== username ||
    existing.email !== email ||
    (existing.avatar ?? "") !== (clerkUser.imageUrl ?? "");

  if (!profileChanged) {
    return existing;
  }

  const { data, error } = await supabaseServer
    .from("users")
    .update({
      username,
      email,
      avatar: clerkUser.imageUrl,
    })
    .eq("id", clerkUser.id)
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

export const setUserOnline = async (userId: string) => {
  const { error } = await supabaseServer
    .from("users")
    .update({
      is_online: true,
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
  const { data: linksData, error: linksError } = await supabaseServer
    .from("contacts")
    .select("owner_id,contact_id,created_at")
    .eq("owner_id", currentUserId)
    .order("created_at", { ascending: false });

  if (linksError) throw linksError;
  const links = (linksData ?? []) as ContactRow[];
  const contactIds = links.map((link) => link.contact_id);
  if (!contactIds.length) return [];

  const { data: usersData, error: usersError } = await supabaseServer
    .from("users")
    .select("*")
    .in("id", contactIds);

  if (usersError) throw usersError;

  return ((usersData ?? []) as UserRow[]).sort((a, b) => {
    const aOnline = isUserOnlineNow(a);
    const bOnline = isUserOnlineNow(b);
    if (aOnline !== bOnline) return aOnline ? -1 : 1;

    const aLastSeen = a.last_seen ? new Date(a.last_seen).getTime() : 0;
    const bLastSeen = b.last_seen ? new Date(b.last_seen).getTime() : 0;
    return bLastSeen - aLastSeen;
  });
};

export const addContactByUsername = async (ownerId: string, username: string) => {
  const normalized = username.trim().replace(/^@+/, "");
  if (!normalized) {
    throw new Error("Username is required.");
  }

  const { data: exactData, error: exactError } = await supabaseServer
    .from("users")
    .select("*")
    .eq("username", normalized)
    .maybeSingle<UserRow>();

  if (exactError) throw exactError;

  let contactUser = exactData;
  if (!contactUser) {
    const { data: fallbackData, error: fallbackError } = await supabaseServer
      .from("users")
      .select("*")
      .ilike("username", normalized)
      .limit(5);

    if (fallbackError) throw fallbackError;
    const fallbackUsers = (fallbackData ?? []) as UserRow[];
    contactUser =
      fallbackUsers.find(
        (user) => user.username.toLowerCase() === normalized.toLowerCase(),
      ) ?? null;
  }

  if (!contactUser) {
    throw new Error("User not found.");
  }

  if (contactUser.id === ownerId) {
    throw new Error("You cannot add yourself.");
  }

  const { error: upsertError } = await supabaseServer
    .from("contacts")
    .upsert(
      {
        owner_id: ownerId,
        contact_id: contactUser.id,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "owner_id,contact_id",
        ignoreDuplicates: true,
      },
    );

  if (upsertError) throw upsertError;
  return contactUser;
};

export const findChatBetweenUsers = async (currentUserId: string, otherUserId: string) => {
  const { data, error } = await supabaseServer
    .from("chats")
    .select("*")
    .eq("chat_type", "direct")
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
      chat_type: "direct",
      user1_id: currentUserId,
      user2_id: otherUserId,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single<ChatRow>();

  if (error) throw error;
  return data;
};

export const markChatMessagesAsSeen = async (chatId: string, viewerId: string) => {
  const chat = await getChatById(chatId);
  if (!chat) {
    throw new Error("Chat not found");
  }

  if (chat.chat_type === "group") {
    const isMember = await isUserMemberOfChat(chatId, viewerId);
    if (!isMember) {
      throw new Error("Forbidden");
    }

    const { data: incomingData, error: incomingError } = await supabaseServer
      .from("messages")
      .select("id,sender_id,is_seen")
      .eq("chat_id", chatId)
      .neq("sender_id", viewerId);

    if (incomingError) throw incomingError;

    const incomingMessages = (incomingData ?? []) as Array<
      Pick<MessageRow, "id" | "sender_id" | "is_seen">
    >;

    if (!incomingMessages.length) {
      return;
    }

    const incomingIds = incomingMessages.map((item) => item.id);

    const { data: existingReadsData, error: existingReadsError } = await supabaseServer
      .from("message_reads")
      .select("message_id")
      .eq("user_id", viewerId)
      .in("message_id", incomingIds);

    if (existingReadsError) throw existingReadsError;

    const existingReads = new Set(
      ((existingReadsData ?? []) as Pick<MessageReadRow, "message_id">[]).map(
        (item) => item.message_id,
      ),
    );

    const now = new Date().toISOString();
    const readsToInsert = incomingIds
      .filter((messageId) => !existingReads.has(messageId))
      .map((messageId) => ({
        message_id: messageId,
        user_id: viewerId,
        seen_at: now,
      }));

    if (readsToInsert.length) {
      const { error: insertError } = await supabaseServer
        .from("message_reads")
        .insert(readsToInsert);

      if (insertError) throw insertError;
    }

    const unreadIncomingIds = incomingMessages
      .filter((item) => !item.is_seen)
      .map((item) => item.id);

    if (unreadIncomingIds.length) {
      const { error: updateError } = await supabaseServer
        .from("messages")
        .update({ is_seen: true })
        .in("id", unreadIncomingIds);

      if (updateError) throw updateError;
    }

    return;
  }

  if (chat.user1_id !== viewerId && chat.user2_id !== viewerId) {
    throw new Error("Forbidden");
  }

  const { error } = await supabaseServer
    .from("messages")
    .update({ is_seen: true })
    .eq("chat_id", chatId)
    .neq("sender_id", viewerId)
    .eq("is_seen", false);

  if (error) throw error;
};

export const sendMessage = async (chatId: string, senderId: string, content: string) => {
  const normalized = normalizeMessageContent(content);
  if (!normalized.replace(/\s/g, "")) return null;

  const { data, error } = await supabaseServer
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content: normalized,
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
  chatType: "direct" | "group";
  slug: string;
  title: string;
  avatar: string | null;
  isOnline: boolean;
  directOtherUserId: string | null;
  memberCount: number | null;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
};

export const getChatListTag = (userId: string) => `chat-list:${userId}`;
export const getChatMessagesTag = (chatId: string) => `chat-messages:${chatId}`;

const getChatListRaw = async (currentUserId: string): Promise<ChatListItem[]> => {
  const { data: directChatsData, error: directChatsError } = await supabaseServer
    .from("chats")
    .select("*")
    .eq("chat_type", "direct")
    .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

  if (directChatsError) throw directChatsError;
  const directChats = (directChatsData ?? []) as ChatRow[];

  const { data: groupMembershipData, error: groupMembershipError } = await supabaseServer
    .from("chat_members")
    .select("chat_id,user_id,role,joined_at")
    .eq("user_id", currentUserId);

  if (groupMembershipError) throw groupMembershipError;
  const memberships = (groupMembershipData ?? []) as ChatMemberRow[];
  const groupChatIds = Array.from(
    new Set(memberships.map((membership) => membership.chat_id)),
  );

  let groupChats: ChatRow[] = [];
  if (groupChatIds.length) {
    const { data: groupChatsData, error: groupChatsError } = await supabaseServer
      .from("chats")
      .select("*")
      .eq("chat_type", "group")
      .in("id", groupChatIds);

    if (groupChatsError) throw groupChatsError;
    groupChats = (groupChatsData ?? []) as ChatRow[];
  }

  const chats = [...directChats, ...groupChats];
  if (!chats.length) return [];

  const otherUserIds = Array.from(
    new Set(
      directChats
        .map((chat) =>
          chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id,
        )
        .filter((id): id is string => Boolean(id)),
    )
  );

  let users: UserRow[] = [];
  if (otherUserIds.length) {
    const { data: usersData, error: usersError } = await supabaseServer
      .from("users")
      .select("*")
      .in("id", otherUserIds);

    if (usersError) throw usersError;
    users = (usersData ?? []) as UserRow[];
  }
  const usersById = new Map(users.map((user) => [user.id, user]));

  const memberCountByChatId = new Map<string, number>();
  if (groupChatIds.length) {
    const { data: groupMembersData, error: groupMembersError } = await supabaseServer
      .from("chat_members")
      .select("chat_id")
      .in("chat_id", groupChatIds);

    if (groupMembersError) throw groupMembersError;

    for (const member of (groupMembersData ?? []) as Pick<ChatMemberRow, "chat_id">[]) {
      memberCountByChatId.set(
        member.chat_id,
        (memberCountByChatId.get(member.chat_id) ?? 0) + 1,
      );
    }
  }

  const chatIds = chats.map((chat) => chat.id);

  const { data: messagesData, error: messagesError } = await supabaseServer
    .from("messages")
    .select("*")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;
  const messages = (messagesData ?? []) as MessageRow[];

  const chatTypeById = new Map(
    chats.map((chat) => [chat.id, chat.chat_type] as const),
  );

  const groupMessageIds = messages
    .filter((message) => {
      const chatId = message.chat_id;
      if (!chatId) return false;
      if (message.sender_id === currentUserId) return false;
      return chatTypeById.get(chatId) === "group";
    })
    .map((message) => message.id);

  const readMessageIdSet = new Set<string>();
  if (groupMessageIds.length) {
    const { data: readsData, error: readsError } = await supabaseServer
      .from("message_reads")
      .select("message_id")
      .eq("user_id", currentUserId)
      .in("message_id", groupMessageIds);

    if (readsError) throw readsError;

    for (const read of (readsData ?? []) as Pick<MessageReadRow, "message_id">[]) {
      readMessageIdSet.add(read.message_id);
    }
  }

  const latestMessageByChat = new Map<string, MessageRow>();
  const unreadCountByChat = new Map<string, number>();

  for (const message of messages) {
    const chatId = message.chat_id;
    if (!chatId) continue;

    if (!latestMessageByChat.has(chatId)) {
      latestMessageByChat.set(chatId, message);
    }

    if (message.sender_id === currentUserId) continue;

    const chatType = chatTypeById.get(chatId) ?? "direct";
    if (chatType === "direct") {
      if (!message.is_seen) {
        unreadCountByChat.set(chatId, (unreadCountByChat.get(chatId) ?? 0) + 1);
      }
      continue;
    }

    if (!readMessageIdSet.has(message.id)) {
      unreadCountByChat.set(chatId, (unreadCountByChat.get(chatId) ?? 0) + 1);
    }
  }

  const items: ChatListItem[] = [];

  for (const chat of chats) {
    const latest = latestMessageByChat.get(chat.id);

    if (chat.chat_type === "group") {
      const title = chat.title?.trim() || "Untitled group";
      items.push({
        chatId: chat.id,
        chatType: "group",
        slug: toGroupSlug(chat.id),
        title,
        avatar: chat.avatar,
        isOnline: false,
        directOtherUserId: null,
        memberCount: memberCountByChatId.get(chat.id) ?? 1,
        lastMessage: latest?.content ?? "No messages yet.",
        updatedAt: latest?.created_at ?? "",
        unreadCount: unreadCountByChat.get(chat.id) ?? 0,
      });
      continue;
    }

    const otherUserId =
      chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;
    if (!otherUserId) continue;

    const otherUser = usersById.get(otherUserId);
    if (!otherUser) continue;

    items.push({
      chatId: chat.id,
      chatType: "direct",
      slug: otherUser.id,
      title: otherUser.username,
      avatar: otherUser.avatar,
      isOnline: isUserOnlineNow(otherUser),
      directOtherUserId: otherUser.id,
      memberCount: null,
      lastMessage: latest?.content ?? "No messages yet.",
      updatedAt: latest?.created_at ?? "",
      unreadCount: unreadCountByChat.get(chat.id) ?? 0,
    });
  }

  return items;
};

export const getChatList = async (currentUserId: string): Promise<ChatListItem[]> =>
  unstable_cache(
    () => getChatListRaw(currentUserId),
    [getChatListTag(currentUserId)],
    {
      revalidate: 30,
      tags: [getChatListTag(currentUserId)],
    },
  )();

const getMessagesByChatIdRaw = async (chatId: string) => {
  const { data, error } = await supabaseServer
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
};

export const getMessagesByChatId = async (chatId: string) =>
  unstable_cache(
    () => getMessagesByChatIdRaw(chatId),
    [getChatMessagesTag(chatId)],
    {
      revalidate: 15,
      tags: [getChatMessagesTag(chatId)],
    },
  )();

export const getChatById = async (chatId: string) => {
  const { data, error } = await supabaseServer
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .maybeSingle<ChatRow>();

  if (error) throw error;
  return data;
};

export const isUserMemberOfChat = async (chatId: string, userId: string) => {
  const { data, error } = await supabaseServer
    .from("chat_members")
    .select("chat_id")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .maybeSingle<Pick<ChatMemberRow, "chat_id">>();

  if (error) throw error;
  return Boolean(data);
};

export const getChatParticipantIds = async (chatId: string): Promise<string[]> => {
  const chat = await getChatById(chatId);
  if (!chat) return [];

  if (chat.chat_type === "group") {
    const { data, error } = await supabaseServer
      .from("chat_members")
      .select("user_id")
      .eq("chat_id", chatId);

    if (error) throw error;
    return Array.from(
      new Set(
        ((data ?? []) as Pick<ChatMemberRow, "user_id">[]).map((item) => item.user_id),
      ),
    );
  }

  return [chat.user1_id, chat.user2_id].filter((item): item is string => Boolean(item));
};

export const getGroupChatById = async (chatId: string) => {
  const chat = await getChatById(chatId);
  if (!chat || chat.chat_type !== "group") return null;
  return chat;
};

export const getGroupMembers = async (chatId: string): Promise<GroupMemberProfile[]> => {
  const { data: membersData, error: membersError } = await supabaseServer
    .from("chat_members")
    .select("chat_id,user_id,role,joined_at")
    .eq("chat_id", chatId);

  if (membersError) throw membersError;
  const members = (membersData ?? []) as ChatMemberRow[];
  if (!members.length) return [];

  const userIds = members.map((member) => member.user_id);
  const { data: usersData, error: usersError } = await supabaseServer
    .from("users")
    .select("*")
    .in("id", userIds);

  if (usersError) throw usersError;

  const usersById = new Map(
    ((usersData ?? []) as UserRow[]).map((user) => [user.id, user]),
  );

  return members
    .map((member) => {
      const user = usersById.get(member.user_id);
      if (!user) return null;
      return {
        user,
        role: member.role,
        joined_at: member.joined_at,
      } satisfies GroupMemberProfile;
    })
    .filter((item): item is GroupMemberProfile => item !== null);
};

export const createGroupChat = async (params: {
  creatorId: string;
  title: string;
  memberIds: string[];
}) => {
  const normalizedTitle = normalizeGroupName(params.title) || "New Group";
  const uniqueMemberIds = Array.from(
    new Set(
      params.memberIds
        .map((id) => id.trim())
        .filter((id) => Boolean(id) && id !== params.creatorId),
    ),
  );

  if (!uniqueMemberIds.length) {
    throw new Error("A group requires at least one member.");
  }

  const now = new Date().toISOString();
  const { data: chatData, error: chatError } = await supabaseServer
    .from("chats")
    .insert({
      chat_type: "group",
      title: normalizedTitle,
      bio: null,
      created_by: params.creatorId,
      created_at: now,
      user1_id: null,
      user2_id: null,
    })
    .select("*")
    .single<ChatRow>();

  if (chatError) throw chatError;

  const membersToInsert = [
    {
      chat_id: chatData.id,
      user_id: params.creatorId,
      role: "admin" as const,
      joined_at: now,
    },
    ...uniqueMemberIds.map((userId) => ({
      chat_id: chatData.id,
      user_id: userId,
      role: "member" as const,
      joined_at: now,
    })),
  ];

  const { error: membersError } = await supabaseServer
    .from("chat_members")
    .insert(membersToInsert);

  if (membersError) throw membersError;

  return chatData;
};

export const updateGroupProfile = async (params: {
  chatId: string;
  actorId: string;
  title: string;
  bio: string;
}) => {
  const chat = await getGroupChatById(params.chatId);
  if (!chat) {
    throw new Error("Group not found");
  }

  const { data: membershipData, error: membershipError } = await supabaseServer
    .from("chat_members")
    .select("role")
    .eq("chat_id", params.chatId)
    .eq("user_id", params.actorId)
    .maybeSingle<Pick<ChatMemberRow, "role">>();

  if (membershipError) throw membershipError;
  if (!membershipData || membershipData.role !== "admin") {
    throw new Error("Only admins can edit group details.");
  }

  const nextTitle = normalizeGroupName(params.title) || "New Group";
  const nextBio = normalizeGroupBio(params.bio) || null;

  const { data, error } = await supabaseServer
    .from("chats")
    .update({ title: nextTitle, bio: nextBio })
    .eq("id", params.chatId)
    .select("*")
    .single<ChatRow>();

  if (error) throw error;
  return data;
};

export const addMembersToGroup = async (params: {
  chatId: string;
  actorId: string;
  memberIds: string[];
}) => {
  const chat = await getGroupChatById(params.chatId);
  if (!chat) {
    throw new Error("Group not found");
  }

  const { data: membershipData, error: membershipError } = await supabaseServer
    .from("chat_members")
    .select("role")
    .eq("chat_id", params.chatId)
    .eq("user_id", params.actorId)
    .maybeSingle<Pick<ChatMemberRow, "role">>();

  if (membershipError) throw membershipError;
  if (!membershipData || membershipData.role !== "admin") {
    throw new Error("Only admins can add members.");
  }

  const uniqueMemberIds = Array.from(
    new Set(
      params.memberIds
        .map((id) => id.trim())
        .filter((id) => Boolean(id) && id !== params.actorId),
    ),
  );
  if (!uniqueMemberIds.length) {
    throw new Error("Select at least one member.");
  }

  const { data: usersData, error: usersError } = await supabaseServer
    .from("users")
    .select("id")
    .in("id", uniqueMemberIds);

  if (usersError) throw usersError;
  const existingUsers = new Set(
    ((usersData ?? []) as Array<Pick<UserRow, "id">>).map((user) => user.id),
  );
  const validIds = uniqueMemberIds.filter((id) => existingUsers.has(id));
  if (!validIds.length) {
    throw new Error("No valid users selected.");
  }

  const { data: existingMembersData, error: existingMembersError } = await supabaseServer
    .from("chat_members")
    .select("user_id")
    .eq("chat_id", params.chatId)
    .in("user_id", validIds);

  if (existingMembersError) throw existingMembersError;
  const existingMemberIds = new Set(
    ((existingMembersData ?? []) as Array<Pick<ChatMemberRow, "user_id">>).map(
      (member) => member.user_id,
    ),
  );

  const now = new Date().toISOString();
  const rowsToInsert = validIds
    .filter((memberId) => !existingMemberIds.has(memberId))
    .map((memberId) => ({
      chat_id: params.chatId,
      user_id: memberId,
      role: "member" as const,
      joined_at: now,
    }));

  if (!rowsToInsert.length) {
    return 0;
  }

  const { error: insertError } = await supabaseServer
    .from("chat_members")
    .insert(rowsToInsert);
  if (insertError) throw insertError;

  return rowsToInsert.length;
};

export const removeMemberFromGroup = async (params: {
  chatId: string;
  actorId: string;
  memberId: string;
}) => {
  const chat = await getGroupChatById(params.chatId);
  if (!chat) {
    throw new Error("Group not found");
  }

  if (params.memberId === params.actorId) {
    throw new Error("You cannot remove yourself.");
  }

  const { data: membershipData, error: membershipError } = await supabaseServer
    .from("chat_members")
    .select("role")
    .eq("chat_id", params.chatId)
    .eq("user_id", params.actorId)
    .maybeSingle<Pick<ChatMemberRow, "role">>();

  if (membershipError) throw membershipError;
  if (!membershipData || membershipData.role !== "admin") {
    throw new Error("Only admins can remove members.");
  }

  const { data: targetData, error: targetError } = await supabaseServer
    .from("chat_members")
    .select("role")
    .eq("chat_id", params.chatId)
    .eq("user_id", params.memberId)
    .maybeSingle<Pick<ChatMemberRow, "role">>();

  if (targetError) throw targetError;
  if (!targetData) {
    throw new Error("Member not found.");
  }

  if (targetData.role === "admin") {
    const { data: adminsData, error: adminsError } = await supabaseServer
      .from("chat_members")
      .select("user_id")
      .eq("chat_id", params.chatId)
      .eq("role", "admin");

    if (adminsError) throw adminsError;
    if ((adminsData ?? []).length <= 1) {
      throw new Error("Cannot remove the last admin.");
    }
  }

  const { error: deleteError } = await supabaseServer
    .from("chat_members")
    .delete()
    .eq("chat_id", params.chatId)
    .eq("user_id", params.memberId);

  if (deleteError) throw deleteError;
};

