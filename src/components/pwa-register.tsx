"use client";

import { useEffect } from "react";

const pushPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const PWARegister = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let syncInFlight = false;

    const syncPushSubscription = async () => {
      if (cancelled || syncInFlight) return;
      syncInFlight = true;

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        await navigator.serviceWorker.ready;

        if (!("PushManager" in window)) return;

        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission().catch(() => "default");
        }

        const existing = await registration.pushManager.getSubscription();
        const hasPermission = Notification.permission === "granted";

        if (!hasPermission) {
          if (existing) {
            await fetch("/api/push/unsubscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ endpoint: existing.endpoint }),
            }).catch(() => null);

            await existing.unsubscribe().catch(() => null);
          }
          return;
        }

        if (!pushPublicKey) return;

        const nextSubscription =
          existing ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(pushPublicKey),
          }));

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: nextSubscription.toJSON(),
          }),
        }).catch(() => null);
      } catch {
        // Ignore unsupported device/browser states.
      } finally {
        syncInFlight = false;
      }
    };

    void syncPushSubscription();
    const onFocus = () => {
      if (document.visibilityState === "hidden") return;
      void syncPushSubscription();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  return null;
};

