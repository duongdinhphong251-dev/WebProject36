import { Breadcrumbs } from "@/components/common/breadcrumbs";
import type { BreadcrumbItemDto } from "@/types/api";
import { Container } from "@/components/ui/container";

interface SpaDetailHeaderProps {
  items: BreadcrumbItemDto[];
}

export function SpaDetailHeader({ items }: SpaDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e9eaeb] bg-white/95 backdrop-blur">
      <Container maxWidth="2xl" className="py-3">
        <Breadcrumbs items={items} />
      </Container>
    </header>
  );
}
