"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T = any> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface CustomTableProps<T = any> {
  columns: Column<T>[];
  data?: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  classWrap?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CustomTable<T = any>({
  columns,
  data = [],
  onRowClick,
  emptyMessage = "No data available",
  classWrap = '',
  size = 'md',
}: CustomTableProps<T>) {
  const sizeClasses = {
    sm: { header: 'h-8 px-2', cell: 'p-2' },
    md: { header: 'h-10 px-3', cell: 'p-3' },
    lg: { header: 'h-12 px-4', cell: 'p-4' },
  };
  return (
    <div className={`w-full overflow-x-auto rounded-md ${classWrap}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead
                key={String(col.key)}
                className={`${sizeClasses[size].header} ${col.headerClassName || ''}`}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length > 0
            ? (
                data.map((row, rowIndex) => (
                  <TableRow
                    key={(row as any).id || rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className="hover:bg-muted/50 cursor-pointer"
                  >
                    {columns.map(col => (
                      <TableCell
                        key={String(col.key)}
                        className={`${sizeClasses[size].cell} ${col.cellClassName || ''}`}
                      >
                        {col.render
                          ? col.render(
                              (row as any)[col.key],
                              row,
                              rowIndex,
                            )
                          : (row as any)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
            : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <div className="text-foreground w-full caption-bottom text-left align-middle text-sm font-normal rtl:text-right">
                      {emptyMessage}
                    </div>
                  </TableCell>
                </TableRow>
              )}
        </TableBody>
      </Table>
    </div>
  );
}
