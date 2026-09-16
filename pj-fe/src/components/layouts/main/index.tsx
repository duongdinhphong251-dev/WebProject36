import type { ReactNode } from "react";
import type { MenuItem } from "@/types/menu";

import HeaderMain from "./header";
import ConditionalFooter from "./conditional-footer";
import FooterPartnerBanner from "./footer-partner-banner";

export default async function LayoutMain({
  children,
  locale,
  menu,
}: {
  children: ReactNode;
  locale: string;
  menu: MenuItem[];
}) {
  return (
    <div className="flex flex-col min-h-dvh w-full overflow-x-clip bg-app-bg">
      <HeaderMain menu={menu} />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
      <ConditionalFooter>
        <FooterPartnerBanner locale={locale} />
      </ConditionalFooter>
    </div>
  );
}
