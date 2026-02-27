import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPage() {
  return (
    <main className="max-w-3xl mx-auto py-8 px-4 animate-pulse">
      <Skeleton className="h-10 w-24 mb-6" />
      <Skeleton className="w-full h-100 mb-8 rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </main>
  );
}
