// components/generic/GenericTable.tsx
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ReactNode } from "react"

interface ColumnDefinition<T> {
  header: string
  accessor: keyof T | ((item: T) => ReactNode)
  cell?: (value: unknown, item: T) => ReactNode
  className?: string
}

interface GenericTableProps<T> {
  data: T[]
  columns: ColumnDefinition<T>[]
  loading?: boolean
  loadingRows?: number
  emptyMessage?: ReactNode
  onRowClick?: (item: T) => void
}

export function GenericTable<T>({
  data,
  columns,
  loading = false,
  loadingRows = 5,
  emptyMessage,
  onRowClick,
}: GenericTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead key={index} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, i) => (
            <TableRow key={i}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyMessage || "No data available"}
            </TableCell>
          </TableRow>
        ) : (
          data.map((item, rowIndex) => (
            <TableRow
              key={rowIndex}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
            >
              {columns.map((column, colIndex) => {
                const value =
                  typeof column.accessor === "function"
                    ? column.accessor(item)
                    : item[column.accessor]

                return (
                  <TableCell key={colIndex} className={column.className}>
                    {column.cell ? column.cell(value, item) : (value as ReactNode)}
                  </TableCell>
                )
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}