import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const ListingCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="aspect-[4/3] bg-muted">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  </Card>
);

export const MyListingSkeleton = () => (
  <Card>
    <CardContent className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <Skeleton className="w-20 sm:w-24 aspect-[4/3] rounded flex-shrink-0" />
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 flex-shrink-0" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ProfileSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div>
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
    </CardContent>
  </Card>
);