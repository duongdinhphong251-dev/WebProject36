"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { cn } from "@/libs/utils";

interface SpaBannerCarouselProps {
  photos: string[];
  name: string;
  variant?: "default" | "compact";
}

const AUTO_PLAY_INTERVAL = 3000;

export function SpaBannerCarousel({
  photos,
  name,
  variant = "default",
}: SpaBannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const renderablePhotos = photos
    .filter((photo) => !failedPhotos.includes(photo))
    .slice(0, 5);
  const total = renderablePhotos.length;

  const maxDots = 20;
  const showDots = total > 1 && total <= maxDots;


  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      const nextIndex = Math.max(0, Math.min(index, total - 1));
      setCurrent(nextIndex);
    },
    [total],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  const handleAutoPlay = useCallback(() => {
    if (total <= 1) return;
    setCurrent((prevCurrent) => (prevCurrent + 1) % total);
  }, [total]);

  const resetTimer = useCallback(() => {
    if (total <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(handleAutoPlay, AUTO_PLAY_INTERVAL);
  }, [handleAutoPlay, total]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    if (current >= total) {
      setCurrent(0);
    }
  }, [current, total]);

  // Touch / Mouse drag handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    isDragging.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = clientX - touchStartX.current;
    const dy = clientY - touchStartY.current;
    // Only mark as horizontal drag when horizontal > vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDragging.current = true;
    }
  };

  const handleDragEnd = (clientX: number) => {
    if (touchStartX.current !== null && isDragging.current) {
      const dx = clientX - touchStartX.current;
      if (dx < -40) {
        next();
      } else if (dx > 40) {
        prev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
    resetTimer();
  };

  const onTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0]!.clientX, e.touches[0]!.clientY);
  const onTouchMove = (e: React.TouchEvent) =>
    handleDragMove(e.touches[0]!.clientX, e.touches[0]!.clientY);
  const onTouchEnd = (e: React.TouchEvent) =>
    handleDragEnd(e.changedTouches[0]!.clientX);

  const onMouseDown = (e: React.MouseEvent) =>
    handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current !== null) {
      handleDragMove(e.clientX, e.clientY);
    }
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (touchStartX.current !== null) {
      handleDragEnd(e.clientX);
    }
  };
  const onMouseLeave = (e: React.MouseEvent) => {
    if (touchStartX.current !== null) {
      handleDragEnd(e.clientX);
    }
  };

  if (total === 0) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-none sm:rounded-2xl bg-gray-100",
          variant === "compact" ? "h-[300px]" : "h-[380px]",
        )}
        aria-label={`Banner ảnh ${name}`}
        role="img"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,179,149,0.38),_transparent_45%),linear-gradient(135deg,_#143423_0%,_#1f5b44_52%,_#2d7a61_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.06)_0%,_transparent_38%,_transparent_62%,_rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/88 shadow-[0_12px_32px_rgba(20,52,35,0.18)] backdrop-blur-sm sm:h-16 sm:w-16">
          <Image
            src="/assets/images/common/logo_x.png"
            alt="Nhom36"
            width={44}
            height={12}
            className="h-auto w-11 sm:w-12"
            priority
            quality={100}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full select-none overflow-hidden rounded-none sm:rounded-2xl bg-gray-100",
        variant === "compact" ? "h-[300px]" : "h-[380px]",
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      aria-label={`Banner ảnh ${name}`}
      role="region"
    >
      {/* Slides */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {renderablePhotos.map((src, i) => (
          <div key={src} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={i === 0 ? name : `${name} – ảnh ${i + 1}`}
              draggable={false}
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
              className="object-cover"
              onError={() => {
                setFailedPhotos((currentFailed) =>
                  currentFailed.includes(src)
                    ? currentFailed
                    : [...currentFailed, src],
                );
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          {current > 0 && (
            <button
              type="button"
              onClick={() => {
                prev();
                resetTimer();
              }}
              aria-label="Ảnh trước"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-opacity hover:bg-white cursor-pointer"
            >
              <ChevronLeft className="size-5 text-[#0a0d12]" />
            </button>
          )}
          {current < total - 1 && (
            <button
              type="button"
              onClick={() => {
                next();
                resetTimer();
              }}
              aria-label="Ảnh sau"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-opacity hover:bg-white cursor-pointer"
            >
              <ChevronRight className="size-5 text-[#0a0d12]" />
            </button>
          )}
        </>
      )}

      {/* Dots indicator */}
      {showDots && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center items-center gap-1.5 flex-wrap px-8">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "block rounded-full transition-all duration-300",
                i === current
                  ? "w-[18px] h-[5px] bg-white"
                  : "w-[5px] h-[5px] bg-white/60",
              )}
            />
          ))}
        </div>
      )}

      {/* Photo count badge */}
      {total > 1 && (
        <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {current + 1} / {total}
        </div>
      )}
    </div>
  );
}
