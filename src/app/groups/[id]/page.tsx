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
import { GroupMembersAdminPanel } from "@/components/group-members-admin-panel";
import { GroupProfileEditor } from "@/components/group-profile-editor";
import { ScrollArea } from "@/components/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addMembersToGroup,
  getChatListTag,
  getGroupChatById,
  getGroupMembers,
  getUserById,
  getContacts,
  isUserOnlineNow,
  removeMemberFromGroup,
  syncUserFromClerk,
  toGroupSlug,
  updateGroupProfile,
} from "@/lib/db";
import { formatLastSeen } from "@/lib/date";

export const metadata: Metadata = {
  title: "Telegraph | Group Profile",
};

type GroupProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const GroupProfilePage = async ({ params }: GroupProfilePageProps) => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
    await syncUserFromClerk(clerkUser);
  } else {
    await getUserById(userId);
  }

  const { id } = await params;
  const group = await getGroupChatById(id);
  if (!group) {
    redirect("/chats");
  }

  const members = await getGroupMembers(group.id);
  const currentMember = members.find((member) => member.user.id === userId);
  if (!currentMember) {
    redirect("/chats");
  }

  const canEdit = currentMember.role === "admin";
  const contacts = canEdit ? await getContacts(userId) : [];
  const currentMemberIds = new Set(members.map((member) => member.user.id));
  const addableContacts = contacts
    .filter((contact) => !currentMemberIds.has(contact.id))
    .map((contact) => {
      const isOnline = isUserOnlineNow(contact);
      return {
        id: contact.id,
        username: contact.username,
        email: contact.email,
        avatar: contact.avatar,
        isOnline,
        statusLabel: isOnline ? "Online" : formatLastSeen(contact.last_seen),
      };
    });
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === "admin" ? -1 : 1;
    }
    return a.user.username.localeCompare(b.user.username);
  });

  const updateAction = async (
    _state: { ok: boolean; error: string },
    formData: FormData,
  ) => {
    "use server";

    const { userId: actorId } = await auth();
    if (!actorId) {
      redirect("/");
    }

    try {
      const title = String(formData.get("title") ?? "");
      const bio = String(formData.get("bio") ?? "");
      await updateGroupProfile({
        chatId: id,
        actorId,
        title,
        bio,
      });

      for (const member of members) {
        revalidateTag(getChatListTag(member.user.id), "max");
      }
      return { ok: true, error: "" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Updating group failed.";
      return { ok: false, error: message };
    }
  };

  const addMembersAction = async (
    _state: { ok: boolean; error: string },
    formData: FormData,
  ) => {
    "use server";

    const { userId: actorId } = await auth();
    if (!actorId) {
      redirect("/");
    }

    try {
      const memberIds = formData
        .getAll("memberIds")
        .map((item) => String(item).trim())
        .filter(Boolean);

      await addMembersToGroup({
        chatId: id,
        actorId,
        memberIds,
      });

      const participantIds = new Set([
        ...members.map((member) => member.user.id),
        ...memberIds,
      ]);
      for (const participantId of participantIds) {
        revalidateTag(getChatListTag(participantId), "max");
      }
      return { ok: true, error: "" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Adding members failed.";
      return { ok: false, error: message };
    }
  };

  const removeMemberAction = async (
    _state: { ok: boolean; error: string },
    formData: FormData,
  ) => {
    "use server";

    const { userId: actorId } = await auth();
    if (!actorId) {
      redirect("/");
    }

    try {
      const memberId = String(formData.get("memberId") ?? "").trim();
      if (!memberId) {
        return { ok: false, error: "Member not found." };
      }

      await removeMemberFromGroup({
        chatId: id,
        actorId,
        memberId,
      });

      const participantIds = new Set([
        ...members.map((member) => member.user.id),
        memberId,
      ]);
      for (const participantId of participantIds) {
        revalidateTag(getChatListTag(participantId), "max");
      }
      return { ok: true, error: "" };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Removing member failed.";
      return { ok: false, error: message };
    }
  };

  return (
    <main className="apple-page h-[calc(100dvh-5.5rem)] overflow-hidden px-4 py-3 md:h-[100dvh] md:px-5">
      <ScrollArea
        className="mx-auto h-full w-full max-w-2xl"
        viewportClassName="pb-24 pt-2 md:pb-6 md:pt-4"
      >
        <Card className="w-full">
          <CardHeader className="items-center gap-3 px-6 py-4 text-center">
            <Avatar className="mx-auto size-28">
              <AvatarImage
                src={group.avatar ?? undefined}
                alt={group.title ?? "Group"}
              />
              <AvatarFallback>
                {(group.title?.trim() || "Group").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {group.title?.trim() || "Untitled group"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {members.length} members
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {canEdit ? (
              <GroupProfileEditor
                initialTitle={group.title?.trim() || ""}
                initialBio={group.bio?.trim() || ""}
                action={updateAction}
              />
            ) : null}

            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-muted-foreground">Bio</p>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground/95">
                {group.bio?.trim() || "No bio yet."}
              </p>
            </div>

            {canEdit ? (
              <GroupMembersAdminPanel
                members={sortedMembers.map((member) => {
                  const isOnline = isUserOnlineNow(member.user);
                  return {
                    id: member.user.id,
                    username: member.user.username,
                    avatar: member.user.avatar,
                    statusLabel: isOnline
                      ? "Online"
                      : formatLastSeen(member.user.last_seen),
                    isOnline,
                    role: member.role,
                    profileHref:
                      member.user.id === userId
                        ? "/profile"
                        : `/contacts/${member.user.id}`,
                    isCurrentUser: member.user.id === userId,
                  };
                })}
                addableContacts={addableContacts}
                addMembersAction={addMembersAction}
                removeMemberAction={removeMemberAction}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Members</p>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  {sortedMembers.map((member, index) => {
                    const isOnline = isUserOnlineNow(member.user);
                    const isLast = index === sortedMembers.length - 1;
                    const profileHref =
                      member.user.id === userId
                        ? "/profile"
                        : `/contacts/${member.user.id}`;
                    return (
                      <Link
                        key={member.user.id}
                        href={profileHref}
                        className={`flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 transition-colors hover:bg-white/5 ${
                          isLast ? "border-b-0" : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-10 ring-1 ring-white/15">
                            <AvatarImage
                              src={member.user.avatar ?? undefined}
                              alt={member.user.username}
                            />
                            <AvatarFallback>
                              {member.user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                            {isOnline ? (
                              <AvatarBadge className="bg-emerald-500" />
                            ) : null}
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {member.user.username}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {isOnline
                                ? "Online"
                                : formatLastSeen(member.user.last_seen)}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {member.role}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center">
              <Button asChild className="h-11 px-8 text-sm font-semibold">
                <Link href={`/chats/${toGroupSlug(group.id)}`}>Open Group</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </main>
  );
};

export default GroupProfilePage;
