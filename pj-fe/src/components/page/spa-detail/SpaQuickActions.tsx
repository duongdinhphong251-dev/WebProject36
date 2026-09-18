"use client";

import { Navigation, Phone, Share2 } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import { cn } from "@/libs/utils";

interface SpaQuickActionsProps {
  spaName: string;
  spaId?: string | number;
  phone?: string | null;
  mapsUrl?: string | null;
  shareUrl: string;
  dictionary?: Record<string, string>;
}

export function SpaQuickActions({
  spaName,
  spaId: _spaId,
  phone,
  mapsUrl,
  shareUrl,
  dictionary,
}: SpaQuickActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = (k: string) => dictionary?.[k] || "";

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: spaName, url: window.location.href || shareUrl });
        return;
      } catch {
        // Fallback to popover
      }
    }
    setShareOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href || shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const itemClass =
    "bg-white rounded-xl py-2.5 px-1 flex flex-col items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(9,62,6,0.06)] text-[10.5px] font-medium text-[#093E06] hover:bg-[#F5F7F4] transition-colors cursor-pointer border border-transparent";

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {/* 1. Chỉ đường */}
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={itemClass}
        >
          <Navigation className="size-[19px] text-[#40813D] stroke-[2]" />
          <span>{t("getDirections") || "Chỉ đường"}</span>
        </a>
      ) : (
        <button
          type="button"
          onClick={() => alert("Địa chỉ chưa có liên kết bản đồ.")}
          className={itemClass}
        >
          <Navigation className="size-[19px] text-[#40813D] stroke-[2]" />
          <span>{t("getDirections") || "Chỉ đường"}</span>
        </button>
      )}

      {/* 2. Gọi */}
      {phone ? (
        <a href={`tel:${phone}`} className={itemClass}>
          <Phone className="size-[19px] text-[#40813D] stroke-[2]" />
          <span>{t("call") || "Gọi"}</span>
        </a>
      ) : (
        <button
          type="button"
          onClick={() => alert("Spa chưa cập nhật số điện thoại.")}
          className={itemClass}
        >
          <Phone className="size-[19px] text-[#40813D] stroke-[2]" />
          <span>{t("call") || "Gọi"}</span>
        </button>
      )}

      {/* 3. Chia sẻ */}
      <Popover open={shareOpen} onOpenChange={setShareOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={handleNativeShare}
            className={itemClass}
          >
            <Share2 className="size-[19px] text-[#40813D] stroke-[2]" />
            <span>{t("share") || "Chia sẻ"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[100] w-[280px] rounded-2xl border border-black/[0.06] bg-white p-0 overflow-hidden shadow-xl"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center gap-2.5 border-b border-[#f2f4f7] px-4 py-3">
            <Share2 className="size-4 text-[#40813D]" />
            <span className="text-sm font-semibold text-[#0a0d12]">{t("share") || "Chia sẻ"}</span>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2 rounded-xl border border-[#e4ebe7] bg-[#f9fafb] px-3 py-2.5">
              <Link2 className="size-3.5 shrink-0 text-[#667085]" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#667085]">
                {typeof window !== "undefined" ? window.location.href : shareUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer",
                copied
                  ? "bg-[#ecfdf3] text-[#067647]"
                  : "bg-[#40813D] text-white hover:bg-[#346a32]",
              )}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  <span>{t("copied") || "Đã sao chép"}</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>{t("copyLink") || "Sao chép liên kết"}</span>
                </>
              )}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
