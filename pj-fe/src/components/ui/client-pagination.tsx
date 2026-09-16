import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function ClientPagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: ClientPaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) {
    return null;
  }

  const pages = getPageRange(currentPage, totalPages);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      {/* Per Page Selector */}
      {onPageSizeChange && pageSize !== undefined && (
        <div className="flex items-center gap-2">
          <Label htmlFor="pageSize" className="text-sm">
            Rows per page:
          </Label>
          <Select
            value={String(pageSize)}
            onValueChange={value =>
              onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger id="pageSize" className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(option => (
                <SelectItem
                  key={JSON.stringify(option)}
                  value={String(option)}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pagination */}
      <div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Prev
              </Button>
            </PaginationItem>

            {pages.map((page, i) =>
              page === "..."
                ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                : (
                    <PaginationItem key={`page-${page}`}>
                      <Button
                        variant={
                          page === currentPage
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() => onPageChange(page)}
                      >
                        {page}
                      </Button>
                    </PaginationItem>
                  ),
            )}

            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function getPageRange(
  current: number,
  total: number,
  delta = 1,
): (number | "...")[] {
  const range: (number | "...")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);

  if (left > 2) {
    range.push("...");
  }

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < total - 1) {
    range.push("...");
  }

  if (total > 1) {
    range.push(total);
  }

  return range;
}
