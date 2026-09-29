"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BasicsTab, SeoTab, SocialTab } from "./tabs"
import type { UpdateCategoryPayload } from "@/lib/types"

interface Props {
  formData: UpdateCategoryPayload
  setFormData: React.Dispatch<React.SetStateAction<UpdateCategoryPayload>>
  loading: boolean
  onSubmit: () => void
}

const tabs = [
  { id: "basics", label: "Temel Bilgiler", Component: BasicsTab },
  { id: "seo", label: "SEO", Component: SeoTab },
  { id: "social", label: "Sosyal Medya", Component: SocialTab },
] as const

export function CategoryForm({ formData, setFormData, loading, onSubmit }: Props) {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const { Component } = tabs[currentTabIndex]

  const isLast = currentTabIndex === tabs.length - 1
  const isFirst = currentTabIndex === 0

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTabIndex(i)}
            className={`p-4 rounded ${i === currentTabIndex ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <Component formData={formData} setFormData={setFormData} />

        <div className="flex justify-between mt-6">
          <Button onClick={() => setCurrentTabIndex((i) => i - 1)} disabled={isFirst}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Önceki
          </Button>
          {isLast ? (
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          ) : (
            <Button onClick={() => setCurrentTabIndex((i) => i + 1)} disabled={!formData.name}>
              Sonraki
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </>
  )
}
