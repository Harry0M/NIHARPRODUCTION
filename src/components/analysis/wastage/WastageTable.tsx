
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { WastageData } from "@/types/wastage";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface WastageTableProps {
  data: WastageData[];
}

export function WastageTable({ data }: WastageTableProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getJobTypeName = (jobType: string): string => {
    switch(jobType) {
      case 'printing_jobs': return 'Printing';
      case 'stitching_jobs': return 'Stitching';
      case 'cutting_jobs': return 'Cutting';
      default: return jobType;
    }
  };

  const getWastageColor = (percentage: number): string => {
    if (percentage < 5) return 'bg-green-100 text-green-800';
    if (percentage < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Job Number</TableHead>
              <TableHead>Job Type</TableHead>
              <TableHead>Worker</TableHead>
              <TableHead className="text-right">Provided</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Wastage</TableHead>
              <TableHead className="text-right">Wastage %</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>{item.order_number}</div>
                    <div className="text-xs text-muted-foreground">{item.company_name}</div>
                  </TableCell>
                  <TableCell>{item.job_number || 'N/A'}</TableCell>
                  <TableCell>{getJobTypeName(item.job_type)}</TableCell>
                  <TableCell>{item.worker_name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{item.provided_quantity}</TableCell>
                  <TableCell className="text-right">{item.received_quantity}</TableCell>
                  <TableCell className="text-right">{item.wastage_quantity}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={getWastageColor(item.wastage_percentage)}>
                      {item.wastage_percentage.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.created_at), 'MMM dd, yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
