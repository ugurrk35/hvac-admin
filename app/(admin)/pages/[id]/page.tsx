"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApi } from "@/lib/api"
import RichTextEditor from "@/components/RichTextEditor"
import { sanitizeHtml } from "@/lib/sanitize-html"

type CmsPageDetail = {
  id: number
  title: string
  slug: string
  contentHtml: string
  isPublished: boolean
  metaTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
}

export default function EditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CmsPageDetail | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApi<{ data: CmsPageDetail }>(`/admin/pages/${id}`)
        setForm(res.data)
      } catch {
        alert("Sayfa bulunamadı")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const update = async () => {
    if (!form) return
    setSaving(true)
    try {
      await fetchApi(`/admin/pages/${id}`, { method: "PUT", body: JSON.stringify({ ...form, contentHtml: sanitizeHtml(form.contentHtml) }) })
      alert("Kaydedildi")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Kaydedilemedi"
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    try {
      await fetchApi(`/admin/pages/${id}`, { method: "DELETE" })
      router.push("/pages")
    } catch {
      alert("Silinemedi")
    }
  }

  if (loading || !form) return <div>Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Sayfa Düzenle</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Geri</Button>
          <Button variant="destructive" onClick={remove}>Sil</Button>
          <Button onClick={update} disabled={saving}>Kaydet</Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input value={form.metaTitle || ""} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Canonical URL</Label>
            <Input value={form.canonicalUrl || ""} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Meta Description</Label>
            <textarea className="w-full border rounded-md p-2 min-h-20" value={form.metaDescription || ""} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>İçerik</Label>
              <div className="flex items-center gap-2 text-sm">
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, contentHtml: `<h2>İletişim</h2><p>Bizimle iletişime geçtiğiniz için teşekkür ederiz. Aşağıdaki kanallardan ulaşabilirsiniz.</p><ul><li>E-posta: info@bebekmakosen.com</li><li>WhatsApp: 90 555 555 55 55</li></ul>` })}>İletişim Şablonu</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, contentHtml: `<h2>Sıkça Sorulan Sorular</h2><details><summary>Kargo süresi ne kadar?</summary><p>Hazırlık ve kargoya teslim süresi ürüne göre değişebilir. Kişiselleştirilmiş ürünlerde güncel süre ürün veya sipariş ekranında gösterilir.</p></details><details><summary>İade ve değişim koşulları nelerdir?</summary><p>Standart ürünlerde, mevzuattaki istisnalar dışında, teslimden itibaren 14 gün içinde iade talebi oluşturabilirsiniz.</p></details><details><summary>İsimli veya kişiselleştirilmiş ürünler iade edilebilir mi?</summary><p>Hayır. İsimli Bebek Makosen modelleri ile müşteriye özel hazırlanan ürünlerde iade veya değişim yapılmaz. Üretim hatası, ayıplı ürün veya siparişten farklı teslimat durumlarında yasal haklar saklıdır.</p></details><details><summary>Yanlış veya hasarlı ürün gelirse ne yapmalıyım?</summary><p>Ürünü kullanmadan, teslimat bilgisi ve fotoğraflarla birlikte müşteri hizmetlerine ulaşın.</p></details>` })}>SSS Şablonu</Button>
                <Switch checked={showPreview} onCheckedChange={setShowPreview} />
                <span>Önizleme</span>
              </div>
            </div>
            <div className="min-h-[256px] border rounded-md">
              {!showPreview ? (
                <div className="p-2">
                  <RichTextEditor value={form.contentHtml} onChange={(v) => setForm({ ...form, contentHtml: v })} />
                </div>
              ) : (
                <div className="p-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.contentHtml) }} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: Boolean(v) })} />
            <span>Yayında</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
