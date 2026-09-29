"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { CheckCircle2, LayoutTemplate, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type FooterLink = { label: string; url?: string | null; pageSlug?: string | null; isExternal?: boolean; sort?: number }
type FooterColumn = { title: string; sort?: number; links: FooterLink[] }
type FooterConfig = { columns: FooterColumn[]; social: FooterLink[]; showNewsletter: boolean }

export default function FooterSettingsPage() {
  const router = useRouter()
  const [columns, setColumns] = useState<FooterColumn[]>([])
  const [social, setSocial] = useState<FooterLink[]>([])
  const [showNewsletter, setShowNewsletter] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchApi<{ id?: number; configJson?: string | null }>("/admin/footer/settings")
        if (s?.configJson) {
          const cfg = JSON.parse(s.configJson) as FooterConfig
          setColumns((cfg.columns || []).map((c, i) => ({ ...c, sort: c.sort ?? i })))
          setSocial((cfg.social || []).map((l, i) => ({ ...l, sort: l.sort ?? i })))
          setShowNewsletter(Boolean(cfg.showNewsletter))
        } else {
          setColumns([
            { title: "Alışveriş", sort: 0, links: [ { label: "Ürünler", url: "/products", sort: 0 } ] },
            { title: "Destek", sort: 1, links: [ { label: "İletişim", pageSlug: "iletisim", sort: 0 } ] },
          ])
        }
      } catch {}
    })()
  }, [])

  const addColumn = () => setColumns(prev => [...prev, { title: "Yeni Kolon", sort: prev.length, links: [] }])
  const removeColumn = (index: number) => setColumns(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sort: i })))
  const updateColumn = (index: number, patch: Partial<FooterColumn>) => setColumns(prev => prev.map((c, i) => i === index ? { ...c, ...patch } : c))

  const addLink = (ci: number) => updateColumn(ci, { links: [ ...(columns[ci]?.links ?? []), { label: "Yeni Link", url: "/", sort: (columns[ci]?.links?.length ?? 0) } ] })
  const removeLink = (ci: number, li: number) => updateColumn(ci, { links: (columns[ci]?.links ?? []).filter((_, i) => i !== li).map((l, i) => ({ ...l, sort: i })) })
  const updateLink = (ci: number, li: number, patch: Partial<FooterLink>) => updateColumn(ci, { links: (columns[ci]?.links ?? []).map((l, i) => i === li ? { ...l, ...patch } : l) })

  const addSocial = () => setSocial(prev => [...prev, { label: "instagram", url: "https://instagram.com", isExternal: true, sort: prev.length }])
  const removeSocial = (i: number) => setSocial(prev => prev.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, sort: idx })))
  const updateSocial = (i: number, patch: Partial<FooterLink>) => setSocial(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))

  const handleSave = async () => {
    const payload: FooterConfig = {
      columns: columns.map((c, i) => ({
        title: c.title.trim(),
        sort: i,
        links: (c.links || []).map((l, j) => ({ label: l.label.trim(), url: l.url || undefined, pageSlug: l.pageSlug || undefined, isExternal: Boolean(l.isExternal), sort: j }))
      })),
      social: (social || []).map((l, i) => ({ label: l.label.trim(), url: l.url || undefined, pageSlug: undefined, isExternal: Boolean(l.isExternal), sort: i })),
      showNewsletter,
    }
    try {
      await fetchApi("/admin/footer/settings", { method: "POST", body: JSON.stringify(payload) })
      setMessage("Footer ayarları kaydedildi.")
    } catch {
      setMessage("Footer ayarları kaydedilemedi.")
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-stone-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-stone-200"><LayoutTemplate className="size-4" />Site navigasyonu</div><h1 className="text-3xl font-bold tracking-tight">Footer ayarları</h1><p className="mt-2 text-sm text-slate-300">Alt menü kolonlarını, sosyal bağlantıları ve bülten alanını yönetin.</p></div><div className="flex gap-3"><div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xs text-slate-300">Kolon</p><p className="mt-1 text-xl font-semibold">{columns.length}</p></div><div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xs text-slate-300">Sosyal link</p><p className="mt-1 text-xl font-semibold">{social.length}</p></div></div></div></div>
      {message&&<div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900"><CheckCircle2 className="size-4" />{message}</div>}
      <div className="flex items-center justify-between px-1"><div><h2 className="font-semibold text-slate-900">Footer yapılandırması</h2><p className="text-sm text-muted-foreground">Değişiklikler kaydedildiğinde vitrinde görünür.</p></div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              // Tek tıkla varsayılan şablon
              setColumns([
                {
                  title: "Alışveriş",
                  sort: 0,
                  links: [
                    { label: "Ürünler", url: "/products", sort: 0 },
                    { label: "Kategoriler", url: "/categories", sort: 1 },
                  ],
                },
                {
                  title: "Destek",
                  sort: 1,
                  links: [
                    { label: "Sıkça Sorulan Sorular", pageSlug: "sss", sort: 0 },
                    { label: "İletişim", pageSlug: "iletisim", sort: 1 },
                  ],
                },
              ])
              setSocial([{ label: "instagram", url: "https://instagram.com/", isExternal: true, sort: 0 }])
              setShowNewsletter(true)
            }}
          >
            Varsayılanları Yükle
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Vazgeç</Button>
          <Button onClick={handleSave}><Save className="mr-2 size-4" />Kaydet</Button>
        </div>
      </div>

      <Card className="border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Switch id="newsletter" checked={showNewsletter} onCheckedChange={setShowNewsletter} />
          <Label htmlFor="newsletter">Bülteni Göster</Label>
        </div>
      </Card>

      <Card className="border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Kolonlar</h2>
          <Button size="sm" onClick={addColumn}>Kolon Ekle</Button>
        </div>
        <div className="space-y-6">
          {columns.map((col, ci) => (
            <div key={ci} className="border rounded-md p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Başlık</Label>
                  <Input value={col.title} onChange={(e) => updateColumn(ci, { title: e.target.value })} />
                </div>
                <Button variant="outline" onClick={() => removeColumn(ci)}>Sil</Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Linkler</Label>
                  <Button size="sm" onClick={() => addLink(ci)}>Link Ekle</Button>
                </div>
                <div className="space-y-3">
                  {(col.links || []).map((l, li) => (
                    <div key={li} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Görünen Ad</Label>
                        <Input value={l.label} onChange={(e) => updateLink(ci, li, { label: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Sayfa Slug</Label>
                        <Input placeholder="örn: iletisim" value={l.pageSlug ?? ""} onChange={(e) => updateLink(ci, li, { pageSlug: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>URL</Label>
                        <Input placeholder="örn: /hakkimizda veya https://..." value={l.url ?? ""} onChange={(e) => updateLink(ci, li, { url: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={Boolean(l.isExternal)} onCheckedChange={(val) => updateLink(ci, li, { isExternal: Boolean(val) })} />
                        <span className="text-xs">Dış Link</span>
                        <Button variant="outline" size="sm" onClick={() => removeLink(ci, li)} className="ml-auto">Kaldır</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sosyal Medya</h2>
          <Button size="sm" onClick={addSocial}>Sosyal Link Ekle</Button>
        </div>
        <div className="space-y-3">
          {social.map((s, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="space-y-1">
                <Label>Platform</Label>
                <Input value={s.label} onChange={(e) => updateSocial(i, { label: e.target.value })} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>URL</Label>
                <Input value={s.url ?? ""} onChange={(e) => updateSocial(i, { url: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={Boolean(s.isExternal)} onCheckedChange={(val) => updateSocial(i, { isExternal: Boolean(val) })} />
                <span className="text-xs">Dış Link</span>
                <Button variant="outline" size="sm" onClick={() => removeSocial(i)} className="ml-auto">Kaldır</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
