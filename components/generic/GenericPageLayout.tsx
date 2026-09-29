// components/generic/GenericPageLayout.tsx
"use client"

import { Card } from "@/components/ui/card"
import { ReactNode } from "react"

interface GenericPageLayoutProps {
  title: string
  description?: string
  totalItems?: number
  children: ReactNode
  headerActions?: ReactNode
  noCardWrapper?: boolean
}

export function GenericPageLayout({
  title,
  description,
  totalItems,
  children,
  headerActions,
  noCardWrapper = false,
}: GenericPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 text-lg">
                {description}
                {totalItems !== undefined && (
                  <span> - Toplam {totalItems} kayıt</span>
                )}
              </p>
            )}
          </div>
          
          {headerActions && (
            <div className="flex flex-col sm:flex-row gap-3">
              {headerActions}
            </div>
          )}
        </div>

        {/* Main Content */}
        {noCardWrapper ? (
          <div>{children}</div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            {children}
          </Card>
        )}
      </div>
    </div>
  )
}