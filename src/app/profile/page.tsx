import { LogoutButton } from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";

const Profile = async () => {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  const username = user?.username ?? "unknown-user";

  return (
    <AppShell>
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="items-center gap-3 px-6 py-4 text-center">
            <Avatar className="mx-auto size-32">
              <AvatarImage src={user?.imageUrl} alt={username} />
              <AvatarFallback>
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{username}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-2 text-xs text-muted-foreground">
                Email addresses
              </p>
              <div className="flex flex-wrap gap-2">
                {user?.emailAddresses.length ? (
                  user.emailAddresses.map((email) => (
                    <span
                      key={email.id}
                      className="rounded-full border px-3 py-1 text-sm"
                    >
                      {email.emailAddress}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No email found.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
};

export default Profile;
