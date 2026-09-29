"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { categoriesApi } from "@/lib/api"

import type { UpdateCategoryPayload } from "@/lib/types"
import { CategoryForm } from "../CategoryForm"

const INITIAL_FORM_DATA: UpdateCategoryPayload = {
  id: 0,
  name: "",
  slug: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterCardType: "",
}

export default function EditCategoryPage() {
  const router = useRouter()
   const params = useParams()
  const id = params.id // ✅ buradan alabilirsin
  const [formData, setFormData] = useState<UpdateCategoryPayload>(INITIAL_FORM_DATA)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tek sayfada id'yi query params ile alabilirsin
  useEffect(() => {
    if (!id) return

    const fetch = async () => {
      try {
        const { data } = await categoriesApi.getCategory(Number(id))
        setFormData({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          metaTitle: '',
          metaDescription: '',
          metaKeywords: '',
          canonicalUrl: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          twitterCardType: ''
        })
      } catch {
        setError("Kategori yüklenemedi.")
      } finally {
        setInitialLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await categoriesApi.updateCategory(formData.id, formData)
      router.push("/categories")
    } catch {
      setError("Kategori güncellenemedi.")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div>Yükleniyor...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <CategoryForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}
