import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncUserFromClerk } from "@/lib/db";

export const POST = async () => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const row = await syncUserFromClerk(user);
    return NextResponse.json({ user: row }, { status: 200 });
  } catch (error) {
    console.error("User sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
};
