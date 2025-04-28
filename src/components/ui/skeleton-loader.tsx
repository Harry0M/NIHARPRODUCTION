
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable = ({ rows = 5, columns = 5 }: SkeletonTableProps) => {
  return (
    <div className="w-full rounded-md border">
      <div className="border-b px-4 py-3 flex items-center">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className={`${i === 0 ? "w-[180px]" : "flex-1"} px-2`}>
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
        <div className="w-[80px]"></div>
      </div>
      
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center px-4 py-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className={`${j === 0 ? "w-[180px]" : "flex-1"} px-2`}>
              <Skeleton className={`h-4 w-${j % 2 === 0 ? "3/4" : "1/2"}`} />
            </div>
          ))}
          <div className="w-[80px] flex justify-end">
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonCardGrid = ({ count = 4 }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const SkeletonForm = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="pt-4">
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};
