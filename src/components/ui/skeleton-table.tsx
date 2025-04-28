
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="w-full rounded-md border">
      <div className="border-b px-4 py-3 flex items-center">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className={`${i === 0 ? "w-[180px]" : "flex-1"} px-2`}>
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center px-4 py-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className={`${j === 0 ? "w-[180px]" : "flex-1"} px-2`}>
              <Skeleton className={`h-4 w-${j % 2 === 0 ? "3/4" : "1/2"}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
