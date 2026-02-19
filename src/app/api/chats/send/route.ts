import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureChatBetweenUsers, sendMessage } from "@/lib/db";

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { recipientId?: string; content?: string }
    | null;

  const recipientId = body?.recipientId?.trim();
  const content = body?.content?.trim();

  if (!recipientId || !content) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const chat = await ensureChatBetweenUsers(userId, recipientId);
    const message = await sendMessage(chat.id, userId, content);

    return NextResponse.json({ chatId: chat.id, message }, { status: 200 });
  } catch (error) {
    console.error("Send message failed:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
};
