"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import RichTextEditor from "@/components/RichTextEditor"
import { blogCategoriesApi, blogPostsApi, imagesApi } from "@/lib/api"

export default function BlogPostCreatePage() {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [imageId, setImageId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isSlugEdited, setIsSlugEdited] = useState(false)

  // SEO alanları
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [metaKeywords, setMetaKeywords] = useState("")
  const [ogTitle, setOgTitle] = useState("")
  const [ogDescription, setOgDescription] = useState("")
  const [ogImageUrl, setOgImageUrl] = useState("")
  const [canonicalUrl, setCanonicalUrl] = useState("")
  const [schemaJson, setSchemaJson] = useState("")

  const router = useRouter()

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!isSlugEdited) {
      setSlug(generateSlug(value))
    }
  }
  
  const handleSlugChange = (value: string) => {
    setSlug(value)
    setIsSlugEdited(true)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const rep = await blogCategoriesApi.getAll()
        if (active && rep) {
          setCategories(rep || [])
        }
      } catch (e) {
        }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const rep = await imagesApi.uploadImage(file)
      if (rep.data && rep.data?.id) {
        setImageId(rep.data?.id)
        const base = process.env.NEXT_PUBLIC_API_URL
        if (!base) throw new Error("NEXT_PUBLIC_API_URL tanımlı değil.")
        setPreviewUrl(base + rep.data.url)
        setMessage(`Resim yüklendi: ${rep.data?.id}`)
      } else {
        setMessage("Resim yüklenemedi")
      }
    } catch {
      setMessage("Resim yüklenirken hata oluştu")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageId) {
      setMessage("Lütfen resim seçin")
      return
    }
    if (!selectedCategory) {
      setMessage("Lütfen kategori seçin")
      return
    }

    setLoading(true)
    try {
      const dto = {
        title,
        slug,
        excerpt,
        content,
        blogCategoryId: selectedCategory,
        publishDate: new Date().toISOString(),
        isPublished,
        isFeatured: false,
        metaTitle,
        metaDescription,
        metaKeywords,
        ogTitle,
        ogDescription,
        ogImageUrl,
        canonicalUrl,
        schemaJson,
        tagIds: [],
        imageIds: [imageId],
      }

      // Using the API method instead of direct fetch
      await blogPostsApi.create(dto)
      setMessage("Blog yazısı başarıyla kaydedildi")
      router.push("/blogs")
    } catch (error) {
      setMessage("Yazı kaydedilemedi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Blog Yazısı</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="seo">SEO / Meta</TabsTrigger>
            </TabsList>

            {/* Genel Sekmesi */}
            <TabsContent value="general">
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                <div className="space-y-8">
                  <div>
                    <Label>Başlık</Label>
                    <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
                  </div>
                  <div>
                    <Label>İçerik</Label>
                    <RichTextEditor value={content} onChange={setContent} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => handleSlugChange(e.target.value)} />
                  </div>

                  <div>
                    <Label>Kategori</Label>
                    <Select onValueChange={(val) => setSelectedCategory(Number(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Kısa Açıklama</Label>
                    <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                  </div>

                <div>
  <Label>Kapak Resmi</Label>
  <Input type="file" accept="image/*" onChange={handleImageChange} />

  {previewUrl && (
    <div className="mt-2">
      <Image
        src={previewUrl}
        alt="Önizleme"
        width={160}
        height={160}
        className="rounded object-contain"
      />
      <p className="text-sm text-green-600">Resim ID: {imageId}</p>
    </div>
  )}
</div>

                  <div className="flex items-center gap-2">
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    <Label>Yayınlansın mı?</Label>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* SEO Sekmesi */}
            <TabsContent value="seo">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Meta Keywords</Label>
                  <Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
                </div>
                <div>
                  <Label>OG Title</Label>
                  <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} />
                </div>
                <div>
                  <Label>OG Description</Label>
                  <Textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} />
                </div>
                <div>
                  <Label>OG Image Url</Label>
                  <Input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} />
                </div>
                <div>
                  <Label>Canonical Url</Label>
                  <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
                </div>
                <div>
                  <Label>Schema JSON</Label>
                  <Textarea value={schemaJson} onChange={(e) => setSchemaJson(e.target.value)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          {message && <p className="mt-4 text-center text-blue-600">{message}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
