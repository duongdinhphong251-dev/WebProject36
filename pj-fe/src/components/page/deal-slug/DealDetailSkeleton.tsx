import { Container } from "@/components/ui/container";

export function DealDetailSkeleton() {
  return (
    <div className="min-h-screen bg-app-bg text-[#0a0d12]">
      {/* Header Skeleton */}
      <div className="hidden md:flex h-[60px] bg-white border-b items-center px-4" />

      <main className="pb-[calc(env(safe-area-inset-bottom,0px)+140px)] lg:pb-12 sm:pt-4">
        <Container maxWidth="2xl">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:gap-6">
            <div className="min-w-0 flex-1 space-y-3 sm:space-y-4">
              {/* Hero Banner Skeleton */}
              <section className="animate-pulse -mx-4 sm:mx-0 overflow-hidden rounded-none sm:rounded-[16px] bg-white shadow-sm">
                <div className="relative h-[250px] sm:h-[400px] bg-gray-200" />
                <div className="space-y-3 px-3.5 py-4 sm:px-6 lg:px-8">
                  <div className="h-6 w-3/4 rounded bg-gray-200" />
                  <div className="h-8 w-1/3 rounded bg-gray-200 mt-2" />
                </div>
              </section>

              {/* Deal Info Skeleton */}
              <section className="animate-pulse rounded-[24px] bg-white p-4 shadow-sm h-64">
                <div className="h-6 w-1/3 rounded bg-gray-200 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-100" />
                  <div className="h-4 w-full rounded bg-gray-100" />
                  <div className="h-4 w-4/5 rounded bg-gray-100" />
                </div>
              </section>
            </div>

            {/* Sidebar Skeleton */}
            <aside className="hidden lg:block w-[352px] shrink-0 animate-pulse">
              <div className="sticky top-4 flex flex-col gap-3">
                <div className="rounded-2xl border border-[#D6DDD3] bg-white p-4 shadow-sm h-64">
                  <div className="h-8 w-1/2 rounded bg-gray-200 mb-4" />
                  <div className="h-10 w-full rounded-xl bg-gray-200 mb-2" />
                  <div className="h-10 w-full rounded-xl bg-gray-200" />
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </main>
    </div>
  );
}
