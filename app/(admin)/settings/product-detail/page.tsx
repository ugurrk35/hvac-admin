"use client"

import { useEffect, useState } from "react"
import { Save, Sparkles } from "lucide-react"
import { categoriesApi, fetchApi } from "@/lib/api"
import type { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type InfoItem = { icon: string; title: string; description: string }
type Settings = {
  backgroundColor: string; accentColor: string; ctaColor: string; blushColor: string
  personalizationBadgeText: string; newBadgeText: string; showNewBadge: boolean
  emptyReviewText: string; reviewInviteText: string
  trustItems: InfoItem[]; featureItems: InfoItem[]
}

const defaults: Settings = {
  backgroundColor: "#FAF6F0", accentColor: "#A9764F", ctaColor: "#4F6350", blushColor: "#F3DDD5",
  personalizationBadgeText: "İsimle Kişiselleştirilebilir", newBadgeText: "Yeni", showNewBadge: true,
  emptyReviewText: "Henüz değerlendirilmedi", reviewInviteText: "İlk yorumu siz yazın",
  trustItems: [
    { icon: "truck", title: "Hızlı kargo", description: "" }, { icon: "rotate", title: "Kolay iade", description: "" }, { icon: "shield", title: "Güvenli ödeme", description: "" },
  ],
  featureItems: [
    { icon: "heart", title: "Elde dikilir", description: "Her çift, tek tek usta ellerden geçer" },
    { icon: "stretch", title: "Lastikli ve esnek", description: "Ayağın rahatça girip çıkmasını sağlar" },
    { icon: "sole", title: "Yumuşak taban", description: "İlk adımlara uygun esnek yapı" },
    { icon: "home", title: "Türkiye'de üretim", description: "İstanbul'daki atölyemizde hazırlanır" },
  ],
}

export default function ProductDetailSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")

  const endpoint = `/admin/product-detail-settings${selectedCategoryId ? `?categoryId=${selectedCategoryId}` : ""}`
  useEffect(() => { categoriesApi.getCategories().then(response => setCategories(response.data ?? [])).catch(() => setMessage("Kategoriler yüklenemedi.")) }, [])
  useEffect(() => { setMessage(""); fetchApi<Settings>(endpoint).then(data => setSettings({ ...defaults, ...data })).catch(() => setMessage("Ayarlar yüklenemedi.")) }, [endpoint])
  const patch = (value: Partial<Settings>) => setSettings(current => ({ ...current, ...value }))
  const updateItem = (key: "trustItems" | "featureItems", index: number, value: Partial<InfoItem>) => patch({ [key]: settings[key].map((item, i) => i === index ? { ...item, ...value } : item) })
  const save = async () => { setSaving(true); setMessage(""); try { const saved = await fetchApi<Settings>(endpoint, { method: "PUT", body: JSON.stringify(settings) }); setSettings(saved); setMessage(selectedCategoryId ? "Kategoriye özel ürün detay ayarları kaydedildi." : "Genel ürün detay ayarları kaydedildi.") } catch { setMessage("Ayarlar kaydedilemedi.") } finally { setSaving(false) } }
  const removeOverride = async () => { if (!selectedCategoryId) return; setSaving(true); try { await fetchApi(endpoint, { method: "DELETE" }); const inherited = await fetchApi<Settings>(endpoint); setSettings({ ...defaults, ...inherited }); setMessage("Kategoriye özel ayar kaldırıldı; genel ayarlar kullanılacak.") } catch { setMessage("Kategori ayarı kaldırılamadı.") } finally { setSaving(false) } }

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <div className="rounded-2xl bg-gradient-to-br from-[#4F6350] to-[#304132] p-7 text-white shadow-lg"><div className="flex items-end justify-between gap-6"><div><p className="flex items-center gap-2 text-sm text-white/75"><Sparkles className="size-4"/>Vitrin tasarımı</p><h1 className="mt-2 text-3xl font-bold">Ürün detay sayfası</h1><p className="mt-2 text-sm text-white/75">Renkleri, rozetleri, güven mesajlarını ve özellik şeridini yönetin.</p></div><Button onClick={save} disabled={saving} className="bg-white text-[#304132] hover:bg-white/90"><Save className="mr-2 size-4"/>{saving ? "Kaydediliyor" : "Kaydet"}</Button></div></div>
    {message && <div className="rounded-xl border bg-white px-4 py-3 text-sm">{message}</div>}
    <Card className="p-6"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><label className="w-full max-w-xl space-y-2"><Label>Ayarların uygulanacağı kategori</Label><select value={selectedCategoryId} onChange={event=>setSelectedCategoryId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Genel ayarlar — tüm kategoriler için varsayılan</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select><p className="text-xs text-muted-foreground">Kategoriye özel kayıt yoksa genel ayarlar otomatik kullanılır.</p></label>{selectedCategoryId&&<Button variant="outline" onClick={removeOverride} disabled={saving}>Kategori özel ayarını kaldır</Button>}</div></Card>
    <Card className="space-y-5 p-6"><h2 className="text-lg font-semibold">Renk paleti</h2><div className="grid gap-4 md:grid-cols-4">{([['backgroundColor','Zemin'],['accentColor','Karamel vurgu'],['ctaColor','CTA / adaçayı'],['blushColor','Pudra pembesi']] as const).map(([key,label]) => <label key={key} className="space-y-2"><Label>{label}</Label><div className="flex gap-2"><Input type="color" className="w-14 p-1" value={settings[key]} onChange={e=>patch({[key]:e.target.value})}/><Input value={settings[key]} onChange={e=>patch({[key]:e.target.value})}/></div></label>)}</div></Card>
    <Card className="space-y-5 p-6"><h2 className="text-lg font-semibold">Rozetler ve değerlendirme</h2><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><Label>Kişiselleştirme rozeti</Label><Input value={settings.personalizationBadgeText} onChange={e=>patch({personalizationBadgeText:e.target.value})}/></label><label className="space-y-2"><Label>Yeni rozeti</Label><Input value={settings.newBadgeText} onChange={e=>patch({newBadgeText:e.target.value})}/></label><label className="space-y-2"><Label>Yorum yok metni</Label><Input value={settings.emptyReviewText} onChange={e=>patch({emptyReviewText:e.target.value})}/></label><label className="space-y-2"><Label>Yoruma davet metni</Label><Input value={settings.reviewInviteText} onChange={e=>patch({reviewInviteText:e.target.value})}/></label></div><label className="flex items-center gap-3 text-sm"><Switch checked={settings.showNewBadge} onCheckedChange={value=>patch({showNewBadge:value})}/>Yeni rozetini göster</label></Card>
    <EditableItems title="CTA altı güven mesajları" items={settings.trustItems} onChange={(i,v)=>updateItem('trustItems',i,v)} />
    <EditableItems title="Özellik şeridi" items={settings.featureItems} onChange={(i,v)=>updateItem('featureItems',i,v)} descriptions />
  </div>
}

function EditableItems({ title, items, onChange, descriptions=false }: { title:string; items:InfoItem[]; onChange:(index:number,value:Partial<InfoItem>)=>void; descriptions?:boolean }) {
  return <Card className="space-y-5 p-6"><h2 className="text-lg font-semibold">{title}</h2><div className="grid gap-4 md:grid-cols-2">{items.map((item,index)=><div key={index} className="grid gap-3 rounded-xl border p-4"><label className="space-y-1"><Label>Başlık</Label><Input value={item.title} onChange={e=>onChange(index,{title:e.target.value})}/></label>{descriptions&&<label className="space-y-1"><Label>Açıklama</Label><Input value={item.description} onChange={e=>onChange(index,{description:e.target.value})}/></label>}</div>)}</div></Card>
}
