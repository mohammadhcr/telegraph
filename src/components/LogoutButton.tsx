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
    await signOut({
      redirectUrl: "/",
    });
  };

  return (
    <Button onClick={Logout} disabled={loading} variant="outline">
      {loading ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
      Sign out
    </Button>
  );
};
