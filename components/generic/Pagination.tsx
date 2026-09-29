// components/generic/Pagination.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasPreviousPage,
  hasNextPage,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Sayfa <span className="font-medium">{currentPage}</span> / {" "}
        <span className="font-medium">{totalPages}</span>
        {" "}(Toplam <span className="font-medium">{totalItems}</span> kayıt)
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          variant="outline"
          size="sm"
          className="hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Önceki
        </Button>
        
        <div className="hidden sm:flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-10 h-10"
              >
                {page}
              </Button>
            )
          })}
        </div>
        
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          variant="outline"
          size="sm"
          className="hover:bg-gray-50"
        >
          Sonraki
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}