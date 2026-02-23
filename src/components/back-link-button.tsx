"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackLinkButtonProps = {
  href: string;
};

export const BackLinkButton = ({ href }: BackLinkButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const onClick = () => {
    if (loading) return;
    setLoading(true);
    startTransition(() => {
      router.push(href);
    });
  };

  const busy = loading || isPending;

  return (
    <Button onClick={onClick} size="icon" variant="ghost" disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeft className="size-4" />}
      <span className="sr-only">Back</span>
    </Button>
  );
};

