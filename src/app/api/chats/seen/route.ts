import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { markChatMessagesAsSeen } from "@/lib/db";

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { chatId?: string } | null;
  const chatId = body?.chatId?.trim();

  if (!chatId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await markChatMessagesAsSeen(chatId, userId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Mark seen failed:", error);
    return NextResponse.json({ error: "Mark seen failed" }, { status: 500 });
  }
};
