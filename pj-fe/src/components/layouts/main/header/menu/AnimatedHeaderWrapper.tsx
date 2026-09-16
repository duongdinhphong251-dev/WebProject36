"use client";

import type { ReactNode } from "react";

import { useEffect, useRef, useState } from "react";

interface AnimatedHeaderWrapperProps {
  children: ReactNode;
  threshold?: number;
  animationDuration?: number;
  onHeightChange?: (height: number) => void;
  isTransparent?: boolean;
  callBackFixed?: (isScrolled: boolean) => void;
}

const AnimatedHeaderWrapper = ({
  children,
  threshold = 100,
  animationDuration = 300,
  onHeightChange,
  isTransparent,
  callBackFixed,
}: AnimatedHeaderWrapperProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (typeof callBackFixed === "function") {
      callBackFixed(isScrolled);
    }
  }, [callBackFixed, isScrolled]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolledPastThreshold = currentScrollY > threshold;
      setIsScrolled(scrolledPastThreshold);
    };

    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [threshold]);

  useEffect(() => {
    if (!headerRef.current) {
      return;
    }

    const callHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 0;

      onHeightChange?.(height);
    };

    callHeight();

    const observer = new ResizeObserver(() => {
      callHeight();
    });

    observer.observe(headerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onHeightChange]);

  return (
    <div
      ref={headerRef}
      className={`border-border right-0 left-0 z-[50] w-full sticky top-0 ${isScrolled
          ? "border-b shadow-md backdrop-blur-md"
          : "border-none shadow-none backdrop-blur-none"
        } ${isTransparent && !isScrolled ? "bg-transparent" : "bg-background"}`}
      style={{
        transition: `all ${animationDuration}ms ease-in-out`,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedHeaderWrapper;
