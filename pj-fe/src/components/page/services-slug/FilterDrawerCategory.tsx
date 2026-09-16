"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Drawer } from "@/components/ui/drawer/Drawer";
import useTranslate from "@/hooks/useTranslate";
import type { LocaleTypes } from "@/i18n/settings";
import type { PageFiltersDto } from "@/types/api";
import { buildSeoUrl } from "@/libs/filter-utils";
import Link from "next/link";

interface FilterDrawerCategoryProps {
  open: boolean;
  onClose: () => void;
  payloadFilters: PageFiltersDto;
}

export function FilterDrawerCategory({
  open,
  onClose,
  payloadFilters,
}: FilterDrawerCategoryProps) {
  const t = useTranslate("filter");
  const locale = (useParams()?.locale as LocaleTypes) ?? "vi";
  const searchParams = useSearchParams();
  const [forceClosed, setForceClosed] = useState(false);

  const { currentService, currentCity, currentDistrict, services } =
    payloadFilters;





  // Parent already closed => clear local force flag for next open cycle.
  useEffect(() => {
    if (!open) setForceClosed(false);
  }, [open]);

  const getLabel = (service: any): string => {
    let name = service.nameVi;
    if (locale === "en" && service.nameEn) name = service.nameEn;
    else if (locale === "ko" && service.nameKo) name = service.nameKo;
    return (name || "").replace(/&amp;/g, "&");
  };

  return (
    <Drawer
      open={open && !forceClosed}
      onClose={() => {
        setForceClosed(false);
        onClose();
      }}
      title={t("category")}
    >
      <div style={{ padding: "16px" }}>
        {/* All option */}
        <Link
          href={(() => {
            let path = buildSeoUrl(
              locale,
              null,
              currentCity?.slug || null,
              currentDistrict?.slug || null,
            );
            if (path === `/${locale}`) path = `/${locale}/deals`;
            const q = searchParams.toString();
            return q ? `${path}?${q}` : path;
          })()}
          scroll={false}
          replace={true}
          onClick={() => {
            setForceClosed(true);
            onClose();
          }}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "14px 16px",
            borderRadius: "12px",
            border: `1.5px solid ${!currentService ? "#5B7A4F" : "#e9eaeb"}`,
            background: !currentService ? "#E6EBE4" : "#ffffff",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: !currentService ? 500 : 400,
            color: !currentService ? "#5B7A4F" : "#0a0d12",
            marginBottom: "8px",
            transition: "background 150ms, border-color 150ms",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: "none",
          }}
        >
          {t("all")}
        </Link>

        {/* Category list */}
        {services?.map((service) => {
          const isActive = currentService?.slugGlobal === service.slugGlobal;
          const href = (() => {
            const path = buildSeoUrl(
              locale,
              service.slugGlobal || null,
              currentCity?.slug || null,
              currentDistrict?.slug || null,
            );
            const q = searchParams.toString();
            return q ? `${path}?${q}` : path;
          })();
          return (
            <Link
              key={service.slugGlobal}
              href={href}
              scroll={false}
              replace={true}
              onClick={() => {
                setForceClosed(true);
                onClose();
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: "12px",
                border: `1.5px solid ${isActive ? "#5B7A4F" : "#e9eaeb"}`,
                background: isActive ? "#E6EBE4" : "#ffffff",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#5B7A4F" : "#0a0d12",
                marginBottom: "8px",
                transition: "background 150ms, border-color 150ms",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textDecoration: "none",
              }}
            >
              {getLabel(service)}
            </Link>
          );
        })}
      </div>
    </Drawer>
  );
}
