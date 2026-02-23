import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canUsePush, savePushSubscription } from "@/lib/push";

type SubscribePayload = {
  subscription?: {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

export const POST = async (req: Request) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canUsePush()) {
    return NextResponse.json({ ok: true, disabled: true }, { status: 200 });
  }

  const body = (await req.json().catch(() => null)) as SubscribePayload | null;
  const subscription = body?.subscription;

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  try {
    await savePushSubscription(userId, {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime ?? null,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Push subscription failed:", error);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
};
