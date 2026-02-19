"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, UsersRound } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabaseBrowser } from "@/lib/supabase-browser";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/contacts", label: "Contacts", icon: UsersRound },
  { href: "/chats", label: "Chats", icon: MessageSquare },
];

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const userName = user?.username || "Profile";
  const profileActive = pathname === "/profile";

  useEffect(() => {
    if (!user) return;

    const sendOnline = () =>
      fetch("/api/presence/online", {
        method: "POST",
        keepalive: true,
      }).catch(() => null);

    const sendOffline = () =>
      navigator.sendBeacon("/api/presence/offline", new Blob([], { type: "application/json" }));

    sendOnline();
    const interval = setInterval(sendOnline, 45_000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        sendOffline();
      } else {
        sendOnline();
      }
    };

    const refreshDebounced = (() => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => router.refresh(), 250);
      };
    })();

    const channel = supabaseBrowser
      .channel(`app-realtime:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refreshDebounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, refreshDebounced)
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, refreshDebounced)
      .subscribe();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", sendOffline);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", sendOffline);
      supabaseBrowser.removeChannel(channel);
    };
  }, [router, user]);

  return (
    <div className="apple-page">
      <aside className="apple-surface fixed inset-y-2 left-2 hidden w-64 rounded-3xl md:flex md:flex-col">
        <div className="border-b border-white/10 p-4">
          <p className="text-lg font-semibold">Telegraph</p>
          <p className="text-xs text-muted-foreground">Messenger</p>
        </div>
        <nav className="space-y-2 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href={item.href}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
          <Button
            asChild
            variant={profileActive ? "secondary" : "ghost"}
            className="h-12 w-full justify-start"
          >
            <Link href="/profile">
              <Avatar className="size-8">
                <AvatarImage src={user?.imageUrl} alt={userName} />
                <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate">{userName}</span>
            </Link>
          </Button>
        </div>
      </aside>

      <main className={cn("md:pl-[17.5rem]")}>
        {children}
      </main>

      <nav className="apple-surface fixed inset-x-2 bottom-2 z-40 grid h-16 grid-cols-3 rounded-3xl px-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-md text-xs",
            profileActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Avatar className="size-5">
            <AvatarImage src={user?.imageUrl} alt={userName} />
            <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="max-w-20 truncate">{userName}</span>
        </Link>
      </nav>
    </div>
  );
};
