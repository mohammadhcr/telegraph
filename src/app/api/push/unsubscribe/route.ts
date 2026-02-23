import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { removePushSubscription } from "@/lib/push";

type UnsubscribePayload = {
  endpoint?: string;
};

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as UnsubscribePayload | null;
  const endpoint = body?.endpoint?.trim();

  if (!endpoint) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await removePushSubscription(userId, endpoint);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Push unsubscription failed:", error);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
};
