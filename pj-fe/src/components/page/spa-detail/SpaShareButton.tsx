"use client";

import { useState, useEffect } from "react";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import ShareIcon from "@/components/icons/organization_services/ShareIcon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/libs/utils";
import { useTranslation } from "@/i18n/client";
import type { LocaleTypes } from "@/i18n/settings";

interface SpaShareButtonProps {
  spaName: string;
  shareUrl: string;
  locale: LocaleTypes;
  buttonClassName?: string;
}

export function SpaShareButton({
  spaName,
  shareUrl,
  locale,
  buttonClassName,
}: SpaShareButtonProps) {
  const { t } = useTranslation(locale, "spa-detail");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // SSR-safe: dùng shareUrl server-side, sau mount cập nhật thành URL thực của browser
  const [actualUrl, setActualUrl] = useState(shareUrl);
  useEffect(() => {
    setActualUrl(window.location.href);
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: spaName, url: actualUrl });
        setOpen(false);
        return;
      } catch {
        // Fall through to popover
      }
    }
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(actualUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${t("share")} ${spaName}`}
          aria-expanded={open}
          onClick={handleNativeShare}
          className={cn(
            "flex items-center justify-center overflow-hidden transition-opacity active:scale-95",
            buttonClassName || "h-10 rounded-[14px] bg-black/20 px-[10px] py-2 backdrop-blur-[18px] hover:bg-black/30",
          )}
        >
          <ShareIcon className="size-5 text-white [&_path]:stroke-white" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "z-[100] w-[280px] rounded-2xl border border-black/[0.06] bg-white p-0 overflow-hidden",
          "shadow-[0px_20px_25px_-5px_rgba(10,13,18,0.10),0px_8px_10px_-6px_rgba(10,13,18,0.06)]",
          "[animation:none!important]",
        )}
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={16}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[#f2f4f7] px-4 py-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#ecfdf3]">
            <ShareIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-[#0a0d12]">
            {t("share")}
          </span>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* URL box */}
          <div className="flex items-center gap-2 rounded-xl border border-[#e4ebe7] bg-[#f9fafb] px-3 py-2.5">
            <Link2 className="size-3.5 shrink-0 text-[#667085]" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#667085]">
              {actualUrl}
            </span>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150",
              copied
                ? "bg-[#ecfdf3] text-[#067647]"
                : "bg-[#5B7A4F] text-white hover:bg-[#4A6340] active:scale-[0.98]",
            )}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="size-4" />
                {t("copy_link")}
              </>
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
