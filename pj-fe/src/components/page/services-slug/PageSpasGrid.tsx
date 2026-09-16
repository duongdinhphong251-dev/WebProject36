import type { Spa } from '@/types/spa';
import type { Deal } from '@/types/deal';
import { SpaListingCard } from './SpaListingCard';

interface PageSpasGridProps {
  spas: Spa[];
  deals?: Deal[];
  title?: string;
  emptyMessage?: string;
}

export function PageSpasGrid({
  spas,
  deals = [],
  title = 'Featured Spas',
  emptyMessage = 'No spas found in this category',
}: PageSpasGridProps) {
  // Group deals by spa slug for efficient lookup
  const dealsBySpa = new Map<string, Deal[]>();
  for (const deal of deals) {
    const arr = dealsBySpa.get(deal.spaSlug) ?? [];
    arr.push(deal);
    dealsBySpa.set(deal.spaSlug, arr);
  }

  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto px-4">
        {title && <h2 className="mb-8 text-2xl font-bold md:text-3xl">{title}</h2>}

        {spas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-6 md:grid md:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:space-y-0">
            {spas.map((spa) => (
              <SpaListingCard
                key={spa.id}
                spa={spa}
                deals={dealsBySpa.get(spa.slug) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
