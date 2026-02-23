import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { setUserOnline } from "@/lib/db";

export const POST = async () => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await setUserOnline(userId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Presence online update failed:", error);
    return NextResponse.json({ error: "Presence update failed" }, { status: 500 });
  }
};

