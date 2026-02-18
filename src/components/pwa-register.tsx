"use client";

import { useEffect } from "react";

export const PWARegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Prevent runtime crashes if service worker registration fails.
      });
    });
  }, []);

  return null;
};
