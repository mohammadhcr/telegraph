import { LogoutButton } from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";
import { formatLastSeen } from "@/lib/date";
import { isUserOnlineNow, syncUserFromClerk } from "@/lib/db";
import { AppPreferences } from "@/components/app-preferences";
import { ProfileEditor } from "@/components/profile-editor";

const Profile = async () => {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  const syncedUser = await syncUserFromClerk(user);
  const username = syncedUser.username;

  return (
    <main className="apple-page h-[calc(100dvh-5.5rem)] min-h-0 overflow-hidden px-4 py-3 md:h-[100dvh] md:px-5">
      <div className=" no-native-scrollbar mx-auto h-full w-full max-w-2xl overflow-y-auto overscroll-y-contain pb-24 pt-2 md:pb-6 md:pt-4">
        <Card className="w-full border-none">
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
                {isUserOnlineNow(syncedUser)
                  ? "Online"
                  : formatLastSeen(syncedUser.last_seen)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileEditor
              initialUsername={syncedUser.username}
              initialFirstName={user.firstName ?? ""}
              initialLastName={user.lastName ?? ""}
            />
            <div className="rounded-lg border border-white/12 bg-white/4 p-4">
              <p className="mb-2 text-xs text-muted-foreground">Email</p>
              <span className="rounded-full border px-3 py-1 text-sm">
                {syncedUser.email}
              </span>
            </div>

            <AppPreferences />

            <div className="flex items-center justify-center pt-1">
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Profile;
