import { Container } from "@/components/ui/container";

/** Skeleton khi đang fetch resolvePage — category hub & geo. */
export function ServiceCategoryRouteSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-app-bg">
      <section className="w-full py-4 md:py-6">
        <Container maxWidth="xl">
          <div className="mb-3 h-3 w-48 rounded bg-gray-200" />
          <div className="h-7 w-full max-w-xl rounded bg-gray-200" />
        </Container>
      </section>
      <Container maxWidth="xl">
        <div className="mb-4 h-10 w-full rounded-lg bg-white shadow-sm" />
      </Container>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 py-4 md:flex-row md:py-6">
        <div className="min-w-0 flex-1">
          <Container maxWidth="xl">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          </Container>
        </div>
      </div>
    </main>
  );
}
