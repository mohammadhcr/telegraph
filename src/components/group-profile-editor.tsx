"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GroupProfileEditorState = {
  ok: boolean;
  error: string;
};

type GroupProfileEditorProps = {
  initialTitle: string;
  initialBio: string;
  action: (
    state: GroupProfileEditorState,
    formData: FormData,
  ) => Promise<GroupProfileEditorState>;
};

const initialState: GroupProfileEditorState = {
  ok: false,
  error: "",
};

export const GroupProfileEditor = ({
  initialTitle,
  initialBio,
  action,
}: GroupProfileEditorProps) => {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);

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
    if (!state.ok) return;
    setOpen(false);
  }, [state.ok]);

  return (
    <>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <PencilLine className="size-4" />
          Edit group
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-xl rounded-lg border border-white/12 bg-black/70 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Edit group</p>
                <p className="text-xs text-muted-foreground">
                  Update group name and bio.
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

            <form action={formAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="group_title">Group name</Label>
                <Input
                  id="group_title"
                  name="title"
                  defaultValue={initialTitle}
                  placeholder="Group name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group_bio">Bio</Label>
                <textarea
                  id="group_bio"
                  name="bio"
                  defaultValue={initialBio}
                  placeholder="Write a short description..."
                  rows={4}
                  className="no-native-scrollbar min-h-24 w-full resize-none rounded-xl border border-white/12 bg-white/4 px-4 py-2 text-[14px] leading-5 outline-none placeholder:text-muted-foreground backdrop-blur-sm"
                />
              </div>

              {state.error ? (
                <p className="text-xs text-destructive">{state.error}</p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="min-w-28" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
