import type { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { ScrollArea } from "@/components/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createGroupChat,
  getChatListTag,
  getContacts,
  isUserOnlineNow,
  syncUserFromClerk,
  toGroupSlug,
} from "@/lib/db";

export const metadata: Metadata = {
  title: "Telegraph | New Group",
};

const NewGroupPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  }

  const contacts = await getContacts(userId);

  const createAction = async (formData: FormData) => {
    "use server";

    const { userId: actorId } = await auth();
    if (!actorId) {
      redirect("/");
    }

    const title = String(formData.get("title") ?? "");
    const memberIds = formData
      .getAll("memberIds")
      .map((item) => String(item))
      .filter(Boolean);

    const group = await createGroupChat({
      creatorId: actorId,
      title,
      memberIds,
    });

    revalidateTag(getChatListTag(actorId), "max");
    for (const memberId of memberIds) {
      revalidateTag(getChatListTag(memberId), "max");
    }

    redirect(`/chats/${toGroupSlug(group.id)}`);
  };

  return (
    <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-3 md:h-[100dvh] md:px-5">
      <ScrollArea
        className="mx-auto h-full w-full max-w-2xl"
        viewportClassName="pb-24 pt-2 md:pb-6 md:pt-4"
      >
        <Card className="w-full">
          <CardHeader className="space-y-2 px-6 py-5">
            <CardTitle className="text-2xl">Create group</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select members and choose a name for the group.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createAction} className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Group name</p>
                <Input name="title" placeholder="Team, Family, Project..." />
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Members</p>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  {contacts.map((contact, index) => {
                    const isOnline = isUserOnlineNow(contact);
                    const isLast = index === contacts.length - 1;
                    return (
                      <label
                        key={contact.id}
                        className={`flex cursor-pointer items-center gap-3 border-b border-white/10 px-4 py-3 transition-colors hover:bg-white/5 ${
                          isLast ? "border-b-0" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="memberIds"
                          value={contact.id}
                          className="size-4 accent-primary"
                        />
                        <Avatar className="size-10 ring-1 ring-white/15">
                          <AvatarImage
                            src={contact.avatar ?? undefined}
                            alt={contact.username}
                          />
                          <AvatarFallback>
                            {contact.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                          {isOnline ? <AvatarBadge className="bg-emerald-500" /> : null}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{contact.username}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.email}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {!contacts.length ? (
                  <p className="text-sm text-muted-foreground">
                    No contacts available for creating a group.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" asChild>
                  <Link href="/chats">Cancel</Link>
                </Button>
                <Button type="submit" disabled={!contacts.length}>
                  Create group
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </ScrollArea>
    </main>
  );
};

export default NewGroupPage;
