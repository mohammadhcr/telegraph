import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  ensureChatBetweenUsers,
  getChatListTag,
  getChatMessagesTag,
  getUserById,
  sendMessage,
} from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { recipientId?: string; content?: string }
    | null;

  const recipientId = body?.recipientId?.trim();
  const content = body?.content;

  if (!recipientId || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const chat = await ensureChatBetweenUsers(userId, recipientId);
    const message = await sendMessage(chat.id, userId, content);

    if (message) {
      const sender = await getUserById(userId);
      const senderName = sender?.username?.trim() || "New message";
      try {
        await sendPushToUser(recipientId, {
          title: senderName,
          body: message.content.slice(0, 120),
          url: `/chats/${userId}`,
        });
      } catch (pushError) {
        console.error("Push notify failed:", pushError);
      }
    }

    revalidateTag(getChatListTag(userId), "max");
    revalidateTag(getChatListTag(recipientId), "max");
    revalidateTag(getChatMessagesTag(chat.id), "max");

    return NextResponse.json({ chatId: chat.id, message }, { status: 200 });
  } catch (error) {
    console.error("Send message failed:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
};

