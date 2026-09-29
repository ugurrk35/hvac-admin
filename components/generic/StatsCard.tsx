// components/generic/StatsCard.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ReactNode } from "react"

interface StatsCardProps {
  icon: ReactNode
  title: string
  value: string
  iconBg?: string
}

export function StatsCard({ icon, title, value, iconBg = "bg-gray-100" }: StatsCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 ${iconBg} rounded-xl`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}