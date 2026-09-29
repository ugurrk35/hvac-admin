"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { categoriesApi } from "@/lib/api"
import type { UpdateCategoryPayload } from "@/lib/types"

export function useEditCategory(id: string) {
  const router = useRouter()
  const [formData, setFormData] = useState<UpdateCategoryPayload>(INITIAL_FORM_DATA)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await categoriesApi.getCategory(Number(id))
       setFormData({
  id: data.id,
  name: data.name,
  slug: data.slug,
  description: data.description,
  metaTitle: '',          // boş string veya API’den geliyorsa değer
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterCardType: ''
})
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
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
      await categoriesApi.updateCategory(Number(id), formData)
      router.push("/categories")
    } catch {
      setError("Kategori güncellenemedi.")
    } finally {
      setLoading(false)
    }
  }

  return { formData, setFormData, loading, error, handleSubmit, initialLoading }
}

const INITIAL_FORM_DATA: UpdateCategoryPayload = {
    id: 0, // ID başlangıçta 0 olabilir, güncelleme sırasında API tarafından ayarlanacak
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
