import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createGroupChat, getChatListTag, toGroupSlug } from "@/lib/db";

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: string; memberIds?: string[] }
    | null;

  const title = String(body?.title ?? "");
  const memberIds = Array.isArray(body?.memberIds)
    ? body.memberIds.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (!memberIds.length) {
    return NextResponse.json(
      { error: "Select at least one member." },
      { status: 400 },
    );
  }

  try {
    const group = await createGroupChat({
      creatorId: userId,
      title,
      memberIds,
    });

    revalidateTag(getChatListTag(userId), "max");
    for (const memberId of memberIds) {
      revalidateTag(getChatListTag(memberId), "max");
    }

    return NextResponse.json(
      { chatId: group.id, slug: toGroupSlug(group.id) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Create group failed:", error);
    return NextResponse.json({ error: "Create group failed" }, { status: 500 });
  }
};

