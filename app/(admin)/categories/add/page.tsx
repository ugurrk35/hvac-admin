"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, generateSlug } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CreateCategoryPayload } from "@/lib/types"
import RichTextEditor from "@/components/RichTextEditor"
import { categoriesApi } from "@/lib/api"

type TabType = "basics" | "seo" | "social"

export default function AddCategoryPage() {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<TabType>("basics")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateCategoryPayload>({
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
  })
const handleSubmit = async () => {
    if (!canProceed()) {
      setError('Lütfen tüm gerekli alanları doldurun')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const resp = await categoriesApi.createCategory(formData)
      if (!resp.success) throw new Error(resp.message || 'Kategori kaydedilemedi')

      alert('Kategori başarıyla kaydedildi!')
      router.push('/categories')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kategori kaydedilirken bir hata oluştu'
      setError(message)
      alert(`Hata: ${message}`)
    } finally {
      setLoading(false)
    }
  }


  const tabs: { id: TabType; label: string }[] = [
    { id: "basics", label: "Temel Bilgiler" },
    { id: "seo", label: "SEO" },
    { id: "social", label: "Sosyal Medya" },
  ]

 const validationRules = {
  basics: ["name", "description", "slug"],
  seo: ["metaTitle", "metaDescription"],
  social: []
};

const canProceed = () => {
  const requiredFields = validationRules[currentTab];
  return requiredFields.every(field => Boolean(formData[field as keyof CreateCategoryPayload]));
};
  const handleNameChange = (value: string) => {
  setFormData((prev: CreateCategoryPayload) => ({
    ...prev,
    name: value,
    slug: generateSlug(value),
  }));
  setError(null);
};
  const renderTabContent = () => {
    switch (currentTab) {
      case "basics":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kategori Adı</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">SEO URL</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <div className="min-h-[200px] border rounded-md border-input">
                <RichTextEditor
                  value={formData.description || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, description: value }))
                  }
                />
              </div>
            </div>
          </div>
        )

      case "seo":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Başlık</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Açıklama</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                className="min-h-[100px] border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaKeywords">Meta Anahtar Kelimeler</Label>
              <Input
                id="metaKeywords"
                value={formData.metaKeywords}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                className="border-palette-lightBlue"
                placeholder="anahtar, kelime, virgül, ile, ayrılmış"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                value={formData.canonicalUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, canonicalUrl: e.target.value }))}
                className="border-palette-lightBlue"
                placeholder="https://example.com/kategori-adi"
              />
            </div>
          </div>
        )

      case "social":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ogTitle">Open Graph Başlık</Label>
              <Input
                id="ogTitle"
                value={formData.ogTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, ogTitle: e.target.value }))}
                className="border-palette-lightBlue"
                placeholder="Sosyal medyada görünecek başlık"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogDescription">Open Graph Açıklama</Label>
              <Textarea
                id="ogDescription"
                value={formData.ogDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, ogDescription: e.target.value }))}
                className="min-h-[100px] border-palette-lightBlue"
                placeholder="Sosyal medyada görünecek açıklama"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogImage">Open Graph Görsel URL</Label>
              <Input
                id="ogImage"
                value={formData.ogImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, ogImage: e.target.value }))}
                className="border-palette-lightBlue"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterCardType">Twitter Card Tipi</Label>
              <Select
                value={formData.twitterCardType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, twitterCardType: value }))}
              >
                <SelectTrigger className="border-palette-lightBlue">
                  <SelectValue placeholder="Twitter card tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Yeni Kategori Ekle</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Debug bilgileri */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium mb-2">Debug Bilgileri:</h3>
        <div className="text-sm space-y-1">
          <p>
            <strong>Aktif Tab:</strong> {currentTab}
          </p>
          <p>
            <strong>İlerleyebilir mi:</strong> {canProceed() ? "✅ Evet" : "❌ Hayır"}
          </p>
          <p>
            <strong>Name:</strong> {formData.name || "Boş"}
          </p>
          <p>
            <strong>Slug:</strong> {formData.slug || "Boş"}
          </p>
          <p>
            <strong>Description:</strong> {formData.description || "Boş"}
          </p>
          <p>
            <strong>Meta Title:</strong> {formData.metaTitle || "Boş"}
          </p>
          <p>
            <strong>Meta Description:</strong> {formData.metaDescription || "Boş"}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={cn(
              "p-4 text-sm text-center rounded-lg transition-colors",
              currentTab === tab.id
                ? "bg-palette-blue text-black font-medium"
                : "bg-palette-lightBlue/20 text-palette-blue hover:bg-palette-lightBlue/30",
              index < tabs.findIndex((t) => t.id === currentTab) && "bg-palette-lightBlue text-black font-medium  ",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {renderTabContent()}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = tabs.findIndex((t) => t.id === currentTab)
              if (currentIndex > 0) {
                setCurrentTab(tabs[currentIndex - 1].id)
              }
            }}
            disabled={currentTab === "basics"}
            className="border-palette-lightBlue hover:bg-palette-lightBlue/20"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Önceki
          </Button>

          {currentTab === "social" ? (
            <Button
              onClick={() => {
                handleSubmit()
              }}
              disabled={loading || !canProceed()}
              className="bg-palette-blue hover:bg-palette-lightBlue text-black hover:text-blue"
            >
              {loading ? "Kaydediliyor..." : "Kategori Kaydet"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const currentIndex = tabs.findIndex((t) => t.id === currentTab)
                if (currentIndex < tabs.length - 1) {
                  setCurrentTab(tabs[currentIndex + 1].id)
                }
              }}
              disabled={!canProceed()}
              className="bg-palette-blue hover:bg-palette-lightBlue text-black hover:text-blue"
            >
              Sonraki
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
