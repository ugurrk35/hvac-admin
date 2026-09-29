"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"
import { blogCategoriesApi } from "@/lib/api"
import { BlogCategory } from "@/lib/types"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function CreateBlogCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await blogCategoriesApi.createCategory(form)
      router.push("/blogs/categories")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Kategori oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Yeni Blog Kategorisi Oluştur</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="og">Open Graph</TabsTrigger>
            </TabsList>

            {/* Genel Bilgiler */}
            <TabsContent value="general" className="space-y-4">
              <div>
                <Label htmlFor="name">Kategori Adı</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={form.slug} onChange={handleChange} required />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <div className="min-h-[300px] border rounded-md border-input">
                  <RichTextEditor
                    value={form.description || ""}
                    onChange={(value: string) =>
                      setForm((prev) => ({ ...prev, description: value }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" name="metaTitle" value={form.metaTitle} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Input id="metaDescription" name="metaDescription" value={form.metaDescription} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input id="metaKeywords" name="metaKeywords" value={form.metaKeywords} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="canonicalUrl">Canonical Url</Label>
                <Input id="canonicalUrl" name="canonicalUrl" value={form.canonicalUrl} onChange={handleChange} />
              </div>
            </TabsContent>

            {/* Open Graph */}
            <TabsContent value="og" className="space-y-4">
              <div>
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input id="ogTitle" name="ogTitle" value={form.ogTitle} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="ogDescription">OG Description</Label>
                <Input id="ogDescription" name="ogDescription" value={form.ogDescription} onChange={handleChange} />
              </div>

              <div>
                <Label htmlFor="ogImageUrl">OG Image Url</Label>
                <Input id="ogImageUrl" name="ogImageUrl" value={form.ogImageUrl} onChange={handleChange} />
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
