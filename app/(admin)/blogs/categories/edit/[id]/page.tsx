"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { blogCategoriesApi } from "@/lib/api"

type BlogCategory = {
  id?: number
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  canonicalUrl: string
}

export default function EditBlogCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [form, setForm] = useState<BlogCategory>({
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    canonicalUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await blogCategoriesApi.getById(id)
        if (active) setForm(data)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Kategori getirilemedi")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  const handleChange = (field: keyof BlogCategory, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await blogCategoriesApi.updateCategory(id, form)
      router.push("/blogs/categories")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncelleme başarısız oldu")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Kategori Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-red-500">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList>
                <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="og">Open Graph</TabsTrigger>
              </TabsList>

              {/* Genel Bilgiler */}
              <TabsContent value="general" className="space-y-4">
                <div>
                  <Label>Adı</Label>
                  <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => handleChange("slug", e.target.value)} />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
                </div>
              </TabsContent>

              {/* SEO */}
              <TabsContent value="seo" className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={form.metaTitle} onChange={(e) => handleChange("metaTitle", e.target.value)} />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea value={form.metaDescription} onChange={(e) => handleChange("metaDescription", e.target.value)} />
                </div>
                <div>
                  <Label>Meta Keywords</Label>
                  <Input value={form.metaKeywords} onChange={(e) => handleChange("metaKeywords", e.target.value)} />
                </div>
              </TabsContent>

              {/* Open Graph */}
              <TabsContent value="og" className="space-y-4">
                <div>
                  <Label>OG Title</Label>
                  <Input value={form.ogTitle} onChange={(e) => handleChange("ogTitle", e.target.value)} />
                </div>
                <div>
                  <Label>OG Description</Label>
                  <Textarea value={form.ogDescription} onChange={(e) => handleChange("ogDescription", e.target.value)} />
                </div>
                <div>
                  <Label>OG Image URL</Label>
                  <Input value={form.ogImageUrl} onChange={(e) => handleChange("ogImageUrl", e.target.value)} />
                </div>
                <div>
                  <Label>Canonical URL</Label>
                  <Input value={form.canonicalUrl} onChange={(e) => handleChange("canonicalUrl", e.target.value)} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/blog/categories")}>
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
