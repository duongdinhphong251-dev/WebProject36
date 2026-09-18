"use client";
import { useParams } from "next/navigation";

import type { Spa } from "@/types/spa";
import type { Deal } from "@/types/deal";
import { DealRow } from "./DealRow";
import Image from "next/image";
import { Star, Eye, MapPin } from "lucide-react";
import useTranslate from "@/hooks/useTranslate";
import CustomLink from "@/components/common/link";
import { SaveSpaButton } from "@/components/common/save-spa-button/SaveSpaButton";

interface SpaListingCardProps {
  spa: Spa;
  deals: Deal[];
}

export function SpaListingCard({ spa, deals }: SpaListingCardProps) {
  const t = useTranslate("services-slug");

  const params = useParams();
  const serviceSlug = params?.serviceSlug as string | undefined;

  const spaHref = serviceSlug 
    ? `/provider/${spa.slug}?ref_service=${serviceSlug}` 
    : `/provider/${spa.slug}`;

  return (
    <div className="relative w-full rounded-3xl bg-white shadow-[0px_1px_10px_-5px_rgba(20,52,35,0.4)] overflow-hidden">
      <div className="absolute top-3 right-3 z-10">
        <SaveSpaButton spaId={spa.slug || spa.id} />
      </div>
      {/* Spa Info Section */}
      <CustomLink href={spaHref} className="p-4 space-y-3 block w-full hover:bg-gray-50 transition-colors">
        <div className="flex w-full gap-3">
          {/* Spa Thumbnail */}
          <div className="relative h-20 w-20 shrink-0 rounded-[20px] overflow-hidden bg-brand-500">
            {spa.imageUrl ? (
              <Image
                src={spa.imageUrl}
                alt={spa.name}
                fill
                className="object-cover"
                quality={100}
              />
            ) : (
              <div className="h-full w-full bg-gray-200" />
            )}
          </div>

          {/* Spa Details */}
          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-semibold text-base text-[#0a0d12] line-clamp-2 break-words whitespace-normal">
              {spa.name}
            </h3>

            {/* Rating & Views */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <span className="text-[12.5px] font-semibold text-[#093E06] leading-none">
                  {Number(spa.rating || 0).toFixed(1)}
                </span>
                <Star className="h-3 w-3 fill-[#fbbf24] text-[#fbbf24]" />
              </div>
              <div className="h-3 w-px bg-[#d5d7da]" />
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-[#414651]" />
                <span className="text-[10px] text-[#414651]">
                  {(spa.reviewCount || 3405).toLocaleString("vi-VN")}{" "}
                  {t("views")}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="h-3 w-3 text-[#414651]" />
              <span className="text-[10px] text-[#414651]">{spa.address}</span>
            </div>
          </div>
        </div>
      </CustomLink>

      {/* Deals Section */}
      {deals.length > 0 && (
        <div className="border-t border-[#e9eaeb] px-4 py-3 space-y-2">
          {deals.slice(0, 2).map((deal) => (
            <DealRow key={deal.id} deal={deal} />
          ))}
          {deals.length > 2 && (
            <p className="text-[10px] text-[#a4a7ae] text-center py-1">
              +{deals.length - 2} {t("more_deals", { count: deals.length - 2 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
