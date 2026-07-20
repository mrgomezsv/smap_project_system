import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-primary/80 via-primary to-primary-700 py-16">
        <div className="container">
          <div className="max-w-2xl space-y-4">
            <div className="h-6 w-32 bg-white/20 rounded-full animate-pulse" />
            <div className="h-12 w-2/3 bg-white/20 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </section>
      <div className="container py-12">
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
