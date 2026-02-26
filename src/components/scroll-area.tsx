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
    const dragOffsetRef = React.useRef<number | null>(null);
    const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const [hasFinePointer, setHasFinePointer] = React.useState(false);
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

    const scrollToThumbTop = React.useCallback(
      (nextThumbTop: number) => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const { scrollHeight, clientHeight } = viewport;
        const railHeight = Math.max(0, clientHeight - RAIL_PADDING * 2);
        const clampedThumbHeight = Math.min(thumbHeight, railHeight);
        const maxOffset = Math.max(0, railHeight - clampedThumbHeight);
        const clampedTop = Math.max(0, Math.min(nextThumbTop, maxOffset));
        const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
        const progress = maxOffset <= 0 ? 0 : clampedTop / maxOffset;

        viewport.scrollTop = progress * maxScrollTop;
        updateIndicator();
      },
      [thumbHeight, updateIndicator],
    );

    const startDragging = React.useCallback(
      (offset: number) => {
        dragOffsetRef.current = offset;
        setShowIndicator(true);

        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }

        const onMouseMove = (event: MouseEvent) => {
          const viewport = viewportRef.current;
          const dragOffset = dragOffsetRef.current;
          if (!viewport || dragOffset === null) return;

          const viewportRect = viewport.getBoundingClientRect();
          const nextTop =
            event.clientY - viewportRect.top - RAIL_PADDING - dragOffset;
          scrollToThumbTop(nextTop);
        };

        const onMouseUp = () => {
          dragOffsetRef.current = null;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          document.body.style.userSelect = "";
          revealIndicator();
        };

        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      },
      [revealIndicator, scrollToThumbTop],
    );

    const handleTrackMouseDown = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !canScroll) return;
        event.preventDefault();

        const trackRect = event.currentTarget.getBoundingClientRect();
        const centeredTop =
          event.clientY - trackRect.top - RAIL_PADDING - thumbHeight / 2;
        scrollToThumbTop(centeredTop);
        startDragging(thumbHeight / 2);
      },
      [canScroll, scrollToThumbTop, startDragging, thumbHeight],
    );

    const handleThumbMouseDown = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !canScroll) return;
        event.preventDefault();
        event.stopPropagation();

        const thumbRect = event.currentTarget.getBoundingClientRect();
        startDragging(event.clientY - thumbRect.top);
      },
      [canScroll, startDragging],
    );

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
      const media = window.matchMedia("(hover: hover) and (pointer: fine)");
      const updatePointerMode = () => setHasFinePointer(media.matches);
      updatePointerMode();

      const addListener = media.addEventListener?.bind(media);
      const removeListener = media.removeEventListener?.bind(media);

      if (addListener && removeListener) {
        addListener("change", updatePointerMode);
        return () => removeListener("change", updatePointerMode);
      }

      media.addListener(updatePointerMode);
      return () => media.removeListener(updatePointerMode);
    }, []);

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
          onMouseMove={() => {
            if (!hasFinePointer) return;
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
            onMouseEnter={() => {
              if (!hasFinePointer) return;
              setShowIndicator(true);
            }}
            onMouseMove={() => {
              if (!hasFinePointer) return;
              setShowIndicator(true);
            }}
            onMouseLeave={() => {
              if (!hasFinePointer) return;
              revealIndicator();
            }}
            onMouseDown={handleTrackMouseDown}
            className={cn(
              "absolute inset-y-0 right-0 w-3 cursor-default transition-opacity duration-300",
              showIndicator ? "opacity-100" : "opacity-0",
            )}
            style={{ cursor: "default" }}
          >
            <div
              onMouseDown={handleThumbMouseDown}
              className="absolute right-[1px] w-[5px] cursor-default rounded-full bg-primary/35"
              style={{
                cursor: "default",
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
