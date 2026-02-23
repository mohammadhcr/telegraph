"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const setMotionPreference = (reduced: boolean) => {
  document.documentElement.dataset.motion = reduced ? "reduced" : "normal";
};

export const AppPreferences = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const motionPref = window.localStorage.getItem("telegraph:pref:motion");
      const reduced = motionPref === "reduced";
      setReducedMotion(reduced);
      setMotionPreference(reduced);
    } catch {
      // Ignore local storage access errors.
    }
  }, []);

  const toggleMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    try {
      window.localStorage.setItem(
        "telegraph:pref:motion",
        next ? "reduced" : "normal",
      );
    } catch {
      // Ignore local storage access errors.
    }
    setMotionPreference(next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/12 bg-white/4 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Display Preferences</h3>
        <p className="text-xs text-muted-foreground">
          Tune animation behavior.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-white/8 bg-black/25 px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <div>
            <p className="text-sm">Motion mode</p>
            <p className="text-xs text-muted-foreground">
              Reduce transitions for smoother low-end devices.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={toggleMotion}>
          {reducedMotion ? "Reduced" : "Normal"}
        </Button>
      </div>
    </div>
  );
};
