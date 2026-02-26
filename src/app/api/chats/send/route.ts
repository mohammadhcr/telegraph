import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  ensureChatBetweenUsers,
  getChatById,
  getChatListTag,
  getChatParticipantIds,
  getChatMessagesTag,
  getUserById,
  isUserMemberOfChat,
  sendMessage,
} from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { recipientId?: string; chatId?: string; content?: string }
    | null;

  const recipientId = body?.recipientId?.trim();
  const chatId = body?.chatId?.trim();
  const content = body?.content;

  if ((!recipientId && !chatId) || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    let chat =
      chatId
        ? await getChatById(chatId)
        : recipientId
          ? await ensureChatBetweenUsers(userId, recipientId)
          : null;

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.chat_type === "group") {
      const isMember = await isUserMemberOfChat(chat.id, userId);
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (chat.user1_id !== userId && chat.user2_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await sendMessage(chat.id, userId, content);

    const participants = await getChatParticipantIds(chat.id);
    const recipientIds = participants.filter((participantId) => participantId !== userId);

    if (message) {
      const sender = await getUserById(userId);
      const senderName = sender?.username?.trim() || "New message";
      const pushUrl =
        chat.chat_type === "group" ? `/chats/group-${chat.id}` : `/chats/${userId}`;

      for (const receiverId of recipientIds) {
        try {
          await sendPushToUser(receiverId, {
            title: senderName,
            body: message.content.slice(0, 120),
            url: pushUrl,
          });
        } catch (pushError) {
          console.error("Push notify failed:", pushError);
        }
      }
    }

    revalidateTag(getChatListTag(userId), "max");
    for (const participantId of participants) {
      revalidateTag(getChatListTag(participantId), "max");
    }
    revalidateTag(getChatMessagesTag(chat.id), "max");

    return NextResponse.json({ chatId: chat.id, message }, { status: 200 });
  } catch (error) {
    console.error("Send message failed:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
};

