import type { Deal } from '@/types/deal';

interface PageDealsListProps {
  deals: Deal[];
  title?: string;
  emptyMessage?: string;
}

export function PageDealsList({
  deals,
  title = 'Flash Sales',
  emptyMessage = 'No deals available',
}: PageDealsListProps) {
  return (
    <section className="w-full bg-gray-50 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {title && <h2 className="mb-8 text-2xl font-bold md:text-3xl">{title}</h2>}

        {deals.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  <p className="text-sm text-gray-600">{deal.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-500">{deal.discount}% OFF</p>
                  <p className="text-xs text-gray-500">Limited time</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
