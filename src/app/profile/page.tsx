import { LogoutButton } from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";
import { formatLastSeen } from "@/lib/date";
import { syncUserFromClerk } from "@/lib/db";

const Profile = async () => {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  const syncedUser = await syncUserFromClerk(user);
  const username = syncedUser.username;

  return (
    <AppShell>
      <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-3 md:h-[100dvh]">
        <div className="no-native-scrollbar mx-auto flex h-full w-full max-w-2xl items-start justify-center overflow-y-auto overscroll-y-contain py-3 md:items-center">
          <Card className="w-full">
            <CardHeader className="items-center gap-3 px-6 py-4 text-center">
              <Avatar className="mx-auto size-32">
                <AvatarImage
                  src={syncedUser.avatar ?? user.imageUrl}
                  alt={username}
                />
                <AvatarFallback>
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{username}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {syncedUser.is_online
                    ? "Online"
                    : formatLastSeen(syncedUser.last_seen)}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 text-xs text-muted-foreground">Email</p>
                <span className="rounded-full border px-3 py-1 text-sm">
                  {syncedUser.email}
                </span>
              </div>

              <div className="flex items-center justify-center pt-1">
                <LogoutButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
};

export default Profile;

