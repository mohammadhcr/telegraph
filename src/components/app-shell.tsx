"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, UserRound, UsersRound } from "lucide-react";
import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();
  const userName = user?.username || "Profile";
  const profileActive = pathname === "/profile";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card md:flex md:flex-col">
        <div className="border-b p-4">
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
        <div className="mt-auto border-t p-3">
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

      <main className="pb-20 md:pb-0 md:pl-64">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-3 border-t bg-card px-2 md:hidden">
        {[...navItems, { href: "/profile", label: "Profile", icon: UserRound }].map((item) => {
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
      </nav>
    </div>
  );
};
