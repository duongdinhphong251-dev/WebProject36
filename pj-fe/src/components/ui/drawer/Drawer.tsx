"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { RemoveScroll } from "react-remove-scroll";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: string;
  footer?: ReactNode;
}

/**
 * Drawer — Bottom sheet portal component for mobile.
 * - Renders via Portal into document.body to avoid z-index conflicts.
 * - Slide-up animation via CSS transform.
 * - Blocks body scroll when open.
 * - Accessible: role="dialog", aria-modal="true".
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  height = "80dvh",
  footer,
}: DrawerProps) {
  // Prevent hydration mismatch — portal only renders after mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <RemoveScroll enabled={open}>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 300ms ease-out",
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          backgroundColor: "#ffffff",
          borderRadius: "16px 16px 0 0",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 300ms ease-out",
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        {/* Drag Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "12px",
            paddingBottom: "8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "52px",
              height: "6px",
              borderRadius: "100px",
              backgroundColor: "#d5d7da",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 16px 12px",
            flexShrink: 0,
            position: "relative",
          }}
        >


          {/* Title — centered absolutely */}
          {title && (
            <span
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "16px",
                fontWeight: 500,
                color: "#0a0d12",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#414651",
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div
          style={{ height: "1px", backgroundColor: "#e9eaeb", flexShrink: 0 }}
        />

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </RemoveScroll>,
    document.body,
  );
}
