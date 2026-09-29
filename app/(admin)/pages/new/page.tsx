"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import RichTextEditor from "@/components/RichTextEditor"
import { sanitizeHtml } from "@/lib/sanitize-html"

export default function NewPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [canonicalUrl, setCanonicalUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      alert("Başlık ve slug zorunludur")
      return
    }
    setSaving(true)
    try {
      const res = await fetchApi<{ data: { id: number } }>("/admin/pages", {
        method: "POST",
        body: JSON.stringify({ title, slug, contentHtml: sanitizeHtml(contentHtml), isPublished, metaTitle, metaDescription, canonicalUrl })
      })
      const id = res?.data?.id
      if (id && Number.isFinite(id)) router.push(`/pages/${id}`)
      else router.push("/pages")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Kaydedilemedi"
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Yeni Sayfa</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Vazgeç</Button>
          <Button onClick={handleSave} disabled={saving}>Kaydet</Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input placeholder="ornek-sayfa" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Canonical URL</Label>
            <Input placeholder="https://..." value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Meta Description</Label>
            <textarea className="w-full border rounded-md p-2 min-h-20" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>İçerik</Label>
              <div className="flex items-center gap-2 text-sm">
                <Button type="button" variant="outline" size="sm" onClick={() => setContentHtml(`<h2>İletişim</h2><p>Bizimle iletişime geçtiğiniz için teşekkür ederiz. Aşağıdaki kanallardan ulaşabilirsiniz.</p><ul><li>E-posta: info@bebekmakosen.com</li><li>WhatsApp: 90 555 555 55 55</li></ul>`)}>İletişim Şablonu</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setContentHtml(`<h2>Sıkça Sorulan Sorular</h2><details><summary>Kargo süresi ne kadar?</summary><p>Hazırlık ve kargoya teslim süresi ürüne göre değişebilir. Kişiselleştirilmiş ürünlerde güncel süre ürün veya sipariş ekranında gösterilir.</p></details><details><summary>İade ve değişim koşulları nelerdir?</summary><p>Standart ürünlerde, mevzuattaki istisnalar dışında, teslimden itibaren 14 gün içinde iade talebi oluşturabilirsiniz.</p></details><details><summary>İsimli veya kişiselleştirilmiş ürünler iade edilebilir mi?</summary><p>Hayır. İsimli Bebek Makosen modelleri ile müşteriye özel hazırlanan ürünlerde iade veya değişim yapılmaz. Üretim hatası, ayıplı ürün veya siparişten farklı teslimat durumlarında yasal haklar saklıdır.</p></details><details><summary>Yanlış veya hasarlı ürün gelirse ne yapmalıyım?</summary><p>Ürünü kullanmadan, teslimat bilgisi ve fotoğraflarla birlikte müşteri hizmetlerine ulaşın.</p></details>`)}>SSS Şablonu</Button>
                <Switch checked={showPreview} onCheckedChange={setShowPreview} />
                <span>Önizleme</span>
              </div>
            </div>
            <div className="min-h-[256px] border rounded-md">
              {!showPreview ? (
                <div className="p-2">
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} />
                </div>
              ) : (
                <div className="p-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            <span>Yayında</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
