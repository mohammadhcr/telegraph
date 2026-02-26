import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { addContactByUsername } from "@/lib/db";

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { username?: string } | null;
  const username = body?.username?.trim();

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  try {
    const contact = await addContactByUsername(userId, username);
    return NextResponse.json({ contactId: contact.id }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Add contact failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
