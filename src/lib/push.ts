import "server-only";
import webpush from "web-push";
import { supabaseServer } from "@/lib/supabase-server";

type PushSubscriptionJson = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: number | null;
};

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT ?? "mailto:no-reply@telegraph.local";

const isPushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (isPushConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
}

export const canUsePush = () => isPushConfigured;

export const savePushSubscription = async (
  userId: string,
  subscription: PushSubscriptionJson,
) => {
  const endpoint = subscription.endpoint?.trim();
  const p256dh = subscription.keys?.p256dh?.trim();
  const auth = subscription.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Invalid push subscription payload.");
  }

  const { error } = await supabaseServer.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      expiration_time: subscription.expirationTime ?? null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) throw error;
};

export const removePushSubscription = async (userId: string, endpoint: string) => {
  const { error } = await supabaseServer
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  if (error) throw error;
};

const deletePushSubscriptionByEndpoint = async (endpoint: string) => {
  const { error } = await supabaseServer
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) throw error;
};

export const sendPushToUser = async (
  userId: string,
  payload: { title: string; body: string; url: string },
) => {
  if (!isPushConfigured) return;

  const { data, error } = await supabaseServer
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth,expiration_time")
    .eq("user_id", userId);

  if (error) throw error;

  const subscriptions = (data ?? []) as PushSubscriptionRow[];
  if (!subscriptions.length) return;

  const payloadJson = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expiration_time,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payloadJson,
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof (error as { statusCode?: unknown }).statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(subscription.endpoint);
          return;
        }

        throw error;
      }
    }),
  );
};
