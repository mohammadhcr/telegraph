"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollAreaProps = {
  className?: string;
  viewportClassName?: string;
  children: React.ReactNode;
};

const MIN_THUMB_HEIGHT = 24;
const RAIL_PADDING = 2;

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, viewportClassName, children }, forwardedRef) => {
    const viewportRef = React.useRef<HTMLDivElement | null>(null);
    const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [canScroll, setCanScroll] = React.useState(false);
    const [thumbHeight, setThumbHeight] = React.useState(MIN_THUMB_HEIGHT);
    const [thumbTop, setThumbTop] = React.useState(0);
    const [showIndicator, setShowIndicator] = React.useState(false);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        viewportRef.current = node;
        if (!forwardedRef) return;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
          return;
        }
        forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const updateIndicator = React.useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const hasOverflow = scrollHeight > clientHeight + 1;
      setCanScroll(hasOverflow);

      if (!hasOverflow) {
        setThumbTop(0);
        return;
      }

      const railHeight = Math.max(0, clientHeight - RAIL_PADDING * 2);
      const nextThumbHeight = Math.max(
        MIN_THUMB_HEIGHT,
        Math.round((clientHeight / scrollHeight) * railHeight),
      );
      const maxOffset = Math.max(0, railHeight - nextThumbHeight);
      const progress =
        scrollHeight === clientHeight
          ? 0
          : scrollTop / (scrollHeight - clientHeight);

      setThumbHeight(nextThumbHeight);
      setThumbTop(Math.round(progress * maxOffset));
    }, []);

    const revealIndicator = React.useCallback(() => {
      if (!canScroll) return;
      setShowIndicator(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setShowIndicator(false);
      }, 1400);
    }, [canScroll]);

    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      updateIndicator();

      const onResize = () => updateIndicator();
      window.addEventListener("resize", onResize);

      const observer = new ResizeObserver(() => updateIndicator());
      observer.observe(viewport);
      if (viewport.firstElementChild) {
        observer.observe(viewport.firstElementChild);
      }

      return () => {
        window.removeEventListener("resize", onResize);
        observer.disconnect();
      };
    }, [updateIndicator]);

    React.useEffect(() => {
      if (!canScroll) {
        setShowIndicator(false);
      }
    }, [canScroll]);

    React.useEffect(() => {
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div className={cn("relative min-h-0", className)}>
        <div
          ref={setRefs}
          onScroll={() => {
            updateIndicator();
            revealIndicator();
          }}
          className={cn(
            "no-native-scrollbar h-full overflow-y-auto overscroll-y-contain",
            viewportClassName,
          )}
        >
          {children}
        </div>

        {canScroll && (
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-1.5 transition-opacity duration-300",
              showIndicator ? "opacity-100" : "opacity-0",
            )}
          >
            <div
              className="absolute right-[2px] w-[3px] rounded-full bg-primary/35"
              style={{
                top: thumbTop + RAIL_PADDING,
                height: thumbHeight,
              }}
            />
          </div>
        )}
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";

