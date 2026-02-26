"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { EllipsisVertical, Loader2, UserPlus, X } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type ActionState = {
  ok: boolean;
  error: string;
};

type AdminMemberItem = {
  id: string;
  username: string;
  avatar: string | null;
  statusLabel: string;
  isOnline: boolean;
  role: "admin" | "member";
  profileHref: string;
  isCurrentUser: boolean;
};

type AddableContact = {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  isOnline: boolean;
  statusLabel: string;
};

type GroupMembersAdminPanelProps = {
  members: AdminMemberItem[];
  addableContacts: AddableContact[];
  addMembersAction: (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  removeMemberAction: (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
};

const initialState: ActionState = { ok: false, error: "" };

export const GroupMembersAdminPanel = ({
  members,
  addableContacts,
  addMembersAction,
  removeMemberAction,
}: GroupMembersAdminPanelProps) => {
  const [open, setOpen] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [addState, addFormAction, isAdding] = useActionState(
    addMembersAction,
    initialState,
  );
  const [removeState, removeFormAction, isRemoving] = useActionState(
    removeMemberAction,
    initialState,
  );

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!addState.ok) return;
    setOpen(false);
    setSelectedIds([]);
  }, [addState.ok]);

  const toggleSelected = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Members</p>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-400"
          onClick={() => setOpen(true)}
        >
          <UserPlus className="size-3.5" />
          Add members
        </Button>
      </div>

      <div className="overflow-visible rounded-xl border border-white/10">
        {members.map((member, index) => {
          const isLast = index === members.length - 1;
          return (
            <div
              key={member.id}
              className={`flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 ${
                isLast ? "border-b-0" : ""
              }`}
            >
              <Link
                href={member.profileHref}
                className="flex min-w-0 items-center gap-3 transition-colors hover:opacity-90"
              >
                <Avatar className="size-10 ring-1 ring-white/15">
                  <AvatarImage
                    src={member.avatar ?? undefined}
                    alt={member.username}
                  />
                  <AvatarFallback>
                    {member.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                  {member.isOnline ? (
                    <AvatarBadge className="bg-emerald-500" />
                  ) : null}
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium flex">
                    {member.username}
                    {member.isCurrentUser ? (
                      <span className="ml-2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.statusLabel}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {member.role}
                </span>
                {!member.isCurrentUser ? (
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setOpenMenuFor((prev) =>
                          prev === member.id ? null : member.id,
                        )
                      }
                    >
                      <EllipsisVertical className="size-4" />
                    </Button>
                    {openMenuFor === member.id ? (
                      <div className="absolute right-0 top-9 z-50 w-36 rounded-md border border-white/12 bg-black/80 p-1 backdrop-blur-md">
                        <form
                          action={async (formData) => {
                            setOpenMenuFor(null);
                            await removeFormAction(formData);
                          }}
                        >
                          <input
                            type="hidden"
                            name="memberId"
                            value={member.id}
                          />
                          <button
                            type="submit"
                            className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-white/10"
                            disabled={isRemoving}
                          >
                            {isRemoving ? (
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            ) : null}
                            Remove
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {removeState.error ? (
        <p className="text-xs text-destructive">{removeState.error}</p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-xl rounded-lg border border-white/12 bg-black/70 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Add members</p>
                <p className="text-xs text-muted-foreground">
                  Select contacts to add to this group.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <form action={addFormAction} className="space-y-3">
              {selectedIds.map((memberId) => (
                <input
                  key={memberId}
                  type="hidden"
                  name="memberIds"
                  value={memberId}
                />
              ))}

              <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10">
                {addableContacts.length ? (
                  addableContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleSelected(contact.id)}
                        className="size-4 accent-primary"
                      />
                      <Avatar className="size-9 ring-1 ring-white/20">
                        <AvatarImage
                          src={contact.avatar ?? undefined}
                          alt={contact.username}
                        />
                        <AvatarFallback>
                          {contact.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                        {contact.isOnline ? (
                          <AvatarBadge className="bg-emerald-500" />
                        ) : null}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {contact.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {contact.email}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No contacts available to add.
                  </p>
                )}
              </div>

              {addState.error ? (
                <p className="text-xs text-destructive">{addState.error}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !selectedIds.length || isAdding || !addableContacts.length
                  }
                >
                  {isAdding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Add selected
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
