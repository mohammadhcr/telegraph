"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReverification, useUser } from "@clerk/nextjs";
import { Loader2, PencilLine, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileEditorProps = {
  initialUsername: string;
  initialFirstName: string;
  initialLastName: string;
};

export const ProfileEditor = ({
  initialUsername,
  initialFirstName,
  initialLastName,
}: ProfileEditorProps) => {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [username, setUsername] = useState(initialUsername);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const updateUserWithReverification = useReverification(
    async (payload: {
      username: string | null;
      firstName: string | null;
      lastName: string | null;
    }) => {
      if (!user) return null;
      return user.update(payload);
    },
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    setUsername(user.username ?? initialUsername);
    setFirstName(user.firstName ?? initialFirstName);
    setLastName(user.lastName ?? initialLastName);
  }, [initialFirstName, initialLastName, initialUsername, isLoaded, user]);

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

  const syncUser = async () => {
    await fetch("/api/users/sync", { method: "POST" }).catch(() => null);
    router.refresh();
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    setError("");

    try {
      await updateUserWithReverification({
        username: username.trim() || null,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      await syncUser();
      setOpen(false);
    } catch (err) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? ((err as { errors?: Array<{ message?: string }> }).errors?.[0]
              ?.message ?? "Profile update failed.")
          : "Profile update failed.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File | null) => {
    if (!user || !file) return;
    setUploading(true);
    setError("");
    try {
      await user.setProfileImage({ file });
      await syncUser();
    } catch (err) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? ((err as { errors?: Array<{ message?: string }> }).errors?.[0]
              ?.message ?? "Image upload failed.")
          : "Image upload failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!user || uploading) return;
    setUploading(true);
    setError("");
    try {
      await user.setProfileImage({ file: null });
      await syncUser();
    } catch (err) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? ((err as { errors?: Array<{ message?: string }> }).errors?.[0]
              ?.message ?? "Removing image failed.")
          : "Removing image failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

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
          Edit profile
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full max-w-xl rounded-lg border border-white/12 bg-black/70 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Edit profile</p>
                <p className="text-xs text-muted-foreground">
                  Update your name, username and avatar.
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

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Label
                htmlFor="profile-image-input"
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 text-xs text-foreground hover:bg-white/5"
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                Upload avatar
              </Label>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void uploadImage(file);
                  event.currentTarget.value = "";
                }}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  void removeImage();
                }}
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Remove avatar
              </Button>
            </div>

            <form onSubmit={saveProfile} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="username"
                />
              </div>

              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-w-28"
                  disabled={saving || uploading}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
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
