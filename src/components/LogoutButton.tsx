"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const LogoutButton = () => {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const Logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/presence/offline", { method: "POST" });
    } catch {
      // Best-effort presence update.
    }
    await signOut({
      redirectUrl: "/",
    });
  };

  return (
    <Button onClick={Logout} disabled={loading} variant="destructive">
      {loading ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
      Sign out
    </Button>
  );
};

