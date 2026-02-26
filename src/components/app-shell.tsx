"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/icon180x180.png";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, UsersRound } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const lastRefreshAtRef = useRef(0);
  const userName = user?.username || "Profile";
  const profileActive = pathname === "/profile";
  const isChatRoomPage = pathname.startsWith("/chats/");

  useEffect(() => {
    if (!user) return;

    const sendOnline = () =>
      fetch("/api/presence/online", {
        method: "POST",
        keepalive: true,
      }).catch(() => null);

    const sendOffline = () =>
      navigator.sendBeacon(
        "/api/presence/offline",
        new Blob([], { type: "application/json" }),
      );

    sendOnline();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendOnline();
      }
    }, 60_000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        sendOffline();
      } else {
        sendOnline();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", sendOffline);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", sendOffline);
    };
  }, [user]);

  useEffect(() => {
    if (isChatRoomPage) return;

    const refreshIfNeeded = () => {
      const now = Date.now();
      if (now - lastRefreshAtRef.current < 15_000) return;
      lastRefreshAtRef.current = now;
      router.refresh();
    };

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        refreshIfNeeded();
      }
    };

    const poll = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshIfNeeded();
      }
    }, 90_000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [isChatRoomPage, router]);

  useEffect(() => {
    const root = document.documentElement;

    const updateKeyboardMetrics = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        root.style.setProperty("--keyboard-height", "0px");
        root.removeAttribute("data-keyboard-open");
        return;
      }

      const keyboardHeight = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
      );
      const isOpen = keyboardHeight > 120;

      root.style.setProperty("--keyboard-height", `${keyboardHeight}px`);
      if (isOpen) {
        root.setAttribute("data-keyboard-open", "true");
      } else {
        root.removeAttribute("data-keyboard-open");
      }
    };

    updateKeyboardMetrics();
    window.visualViewport?.addEventListener("resize", updateKeyboardMetrics);
    window.visualViewport?.addEventListener("scroll", updateKeyboardMetrics);
    window.addEventListener("focusin", updateKeyboardMetrics);
    window.addEventListener("focusout", updateKeyboardMetrics);

    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        updateKeyboardMetrics,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updateKeyboardMetrics,
      );
      window.removeEventListener("focusin", updateKeyboardMetrics);
      window.removeEventListener("focusout", updateKeyboardMetrics);
      root.style.setProperty("--keyboard-height", "0px");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return (
    <div
      className="apple-page relative"
      style={
        isChatRoomPage
          ? {
              ["--chat-composer-bottom" as string]:
                "max(0.35rem, env(safe-area-inset-bottom))",
            }
          : undefined
      }
    >
      <aside className="bg-white/2 border border-white/10 fixed inset-y-3 left-3 hidden w-72 rounded-[1.5rem] md:flex md:flex-col">
        <div className="tg-divider p-5">
          <div className="flex items-center gap-3">
            <Image
              src={Logo}
              alt="Telegraph logo"
              width={40}
              height={40}
              className="size-10 rounded-md"
              priority
            />
            <div className="min-w-0">
              <p className="text-[1.1rem] font-semibold leading-tight tracking-tight">
                Telegraph
              </p>
              <p className="mt-1 text-xs leading-tight text-muted-foreground">
                Fast, Secure & Free
              </p>
            </div>
          </div>
        </div>
        <nav className="space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "h-11 w-full justify-start rounded-md text-[0.95rem]",
                  isActive
                    ? "bg-primary/25 text-primary hover:bg-primary/25"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Link href={item.href}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <Button
            asChild
            variant={profileActive ? "secondary" : "ghost"}
            className={cn(
              "h-12 w-full justify-start rounded-lg",
              profileActive
                ? "bg-primary/18 text-primary hover:bg-primary/18"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Link href="/profile">
              <Avatar className="size-8">
                <AvatarImage src={user?.imageUrl} alt={userName} />
                <AvatarFallback>
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{userName}</span>
            </Link>
          </Button>
        </div>
      </aside>

      <main className={cn("md:pl-[19.5rem]")}>{children}</main>

      {!isChatRoomPage ? (
        <nav className="mobile-tabbar tg-surface fixed inset-x-3 bottom-3 z-40 grid h-[4.2rem] grid-cols-3 rounded-xl px-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg text-[11px] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-[1.15rem]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/profile"
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg text-[11px] transition-colors",
              profileActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Avatar className="size-6">
              <AvatarImage src={user?.imageUrl} alt={userName} />
              <AvatarFallback>
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-24 truncate">{userName}</span>
          </Link>
        </nav>
      ) : null}
    </div>
  );
};
