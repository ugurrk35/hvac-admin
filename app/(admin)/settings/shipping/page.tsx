"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, MapPin, PackageCheck, Pencil, Plus, Trash2, Truck, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApi } from "@/lib/api"

type ShippingMethod = {
  id: number
  name: string
  price: number
  freeShippingThreshold?: number | null
  trackingUrl: string
  isActive: boolean
}

type ApiResponse<T> = { data: T }
type Form = Omit<ShippingMethod, "id">
type RateOverride = { id:number; city:string; district?:string|null; price?:number|null; freeShippingThreshold?:number|null; isActive:boolean }
const emptyForm: Form = { name: "", price: 0, freeShippingThreshold: 750, trackingUrl: "", isActive: true }

export default function ShippingSettingsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [form, setForm] = useState<Form>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [rateMethodId, setRateMethodId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShippingMethod | null>(null)
  const [isMethodSelectionEnabled, setIsMethodSelectionEnabled] = useState(false)
  const [savingDisplay, setSavingDisplay] = useState(false)

  const load = async () => {
    const [response, settings] = await Promise.all([
      fetchApi<ApiResponse<ShippingMethod[]>>("/admin/shipping-methods"),
      fetchApi<ApiResponse<{ isMethodSelectionEnabled: boolean }>>("/admin/shipping-methods/settings"),
    ])
    setMethods(response.data ?? [])
    setIsMethodSelectionEnabled(settings.data?.isMethodSelectionEnabled ?? false)
  }

  useEffect(() => { load().catch(() => setMessage("Kargo yöntemleri yüklenemedi.")) }, [])

  const saveDisplay = async (value: boolean) => {
    setSavingDisplay(true); setMessage(null)
    try {
      await fetchApi("/admin/shipping-methods/settings", { method: "PUT", body: JSON.stringify({ isMethodSelectionEnabled: value }) })
      setIsMethodSelectionEnabled(value); setMessage(value ? "Kargo yöntemi seçimi müşterilere gösteriliyor." : "Kargo yöntemi seçimi müşterilerden gizlendi.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Görünürlük ayarı kaydedilemedi.") }
    finally { setSavingDisplay(false) }
  }

  const save = async () => {
    setSaving(true); setMessage(null)
    try {
      const endpoint = editingId ? `/admin/shipping-methods/${editingId}` : "/admin/shipping-methods"
      await fetchApi(endpoint, { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) })
      setForm(emptyForm); setEditingId(null); setMessage("Kaydedildi.")
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kaydedilemedi.")
    } finally { setSaving(false) }
  }

  const edit = (method: ShippingMethod) => {
    setEditingId(method.id)
    setForm({ name: method.name, price: method.price, freeShippingThreshold: method.freeShippingThreshold, trackingUrl: method.trackingUrl, isActive: method.isActive })
  }

  const remove = async () => {
    if (!deleteTarget) return
    try { await fetchApi(`/admin/shipping-methods/${deleteTarget.id}`, { method: "DELETE" }); setDeleteTarget(null); setMessage("Kargo yöntemi pasife alındı."); await load() }
    catch (error) { setMessage(error instanceof Error ? error.message : "Kargo yöntemi güncellenemedi.") }
  }

  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <div className="rounded-2xl bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-cyan-200"><Truck className="size-4" />Teslimat operasyonu</div><h1 className="text-3xl font-bold tracking-tight">Kargo ayarları</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Kargo seçeneklerini, ücretsiz kargo eşiklerini ve bölgesel fiyat kurallarını tek noktadan yönetin.</p></div><div className="grid grid-cols-2 gap-5 rounded-xl border border-white/10 bg-white/10 px-5 py-3"><div><p className="text-xs text-slate-300">Aktif yöntem</p><p className="mt-1 text-xl font-semibold">{methods.filter(x=>x.isActive).length}</p></div><div><p className="text-xs text-slate-300">Toplam yöntem</p><p className="mt-1 text-xl font-semibold">{methods.length}</p></div></div></div></div>
    {message && <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900"><CheckCircle2 className="size-4" />{message}</div>}
    <Card className="flex items-center justify-between gap-4 border-slate-200 p-5 shadow-sm"><div><h2 className="font-bold text-slate-900">Checkout kargo yöntemi</h2><p className="mt-1 text-sm text-muted-foreground">Tanım yapılana kadar kapalı tutun. Kapalıyken ödeme ekranında kargo seçimi görünmez.</p></div><div className="flex items-center gap-3"><Switch checked={isMethodSelectionEnabled} disabled={savingDisplay} onCheckedChange={value => void saveDisplay(value)} /><span className="text-sm font-medium">{isMethodSelectionEnabled ? "Göster" : "Gizle"}</span></div></Card>
    <Card className="border-slate-200 p-5 shadow-sm md:p-7 space-y-5">
      <div className="flex items-start justify-between border-b pb-5"><div><h2 className="text-xl font-bold text-slate-900">{editingId ? "Kargo yöntemini düzenle" : "Yeni kargo yöntemi"}</h2><p className="mt-1 text-sm text-muted-foreground">Müşterinin checkout aşamasında göreceği teslimat seçeneğini tanımlayın.</p></div>{editingId&&<Button variant="ghost" onClick={()=>{setEditingId(null);setForm(emptyForm)}}><X className="mr-2 size-4" />İptal</Button>}</div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2"><Label>Ad</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Yurtiçi Kargo" /></div>
        <div className="space-y-2"><Label>Kargo ücreti (₺)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Ücretsiz kargo eşiği (₺)</Label><Input type="number" min="0" step="0.01" value={form.freeShippingThreshold ?? ""} onChange={e => setForm({ ...form, freeShippingThreshold: e.target.value === "" ? null : Number(e.target.value) })} /></div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2"><Label>Takip URL şablonu</Label><Input value={form.trackingUrl} onChange={e => setForm({ ...form, trackingUrl: e.target.value })} placeholder="https://kargo.example.com/takip/{trackingNo}" /></div>
        <div className="flex items-end gap-3"><Switch checked={form.isActive} onCheckedChange={isActive => setForm({ ...form, isActive })} /><span className="text-sm">Aktif</span></div>
      </div>
      <div className="flex justify-end gap-2"><Button onClick={save} disabled={saving}><Plus className="mr-2 size-4" />{saving ? "Kaydediliyor..." : editingId?"Değişiklikleri kaydet":"Kargo yöntemi ekle"}</Button></div>
    </Card>
    <Card className="overflow-hidden border-slate-200 shadow-sm"><div className="flex items-center justify-between border-b p-5 md:px-7"><div><h2 className="font-bold text-slate-900">Kargo yöntemleri</h2><p className="mt-1 text-sm text-muted-foreground">Kural ve bölgesel fiyatlandırmaları buradan yönetin.</p></div><Badge variant="secondary">{methods.length} yöntem</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 md:px-7">Yöntem</th><th className="px-5 py-3">Ücret</th><th className="px-5 py-3">Ücretsiz kargo</th><th className="px-5 py-3">Durum</th><th className="px-5 py-3 md:px-7" /></tr></thead><tbody>{methods.length?methods.map(method => <tr key={method.id} className="border-t transition-colors hover:bg-slate-50/80"><td className="px-5 py-4 font-semibold text-slate-900 md:px-7">{method.name}{method.trackingUrl&&<p className="mt-1 text-xs font-normal text-slate-400">Takip bağlantısı tanımlı</p>}</td><td className="px-5 py-4">₺{method.price}</td><td className="px-5 py-4">{method.freeShippingThreshold == null ? "Yok" : `₺${method.freeShippingThreshold} üzeri`}</td><td className="px-5 py-4"><Badge className={method.isActive?"bg-emerald-100 text-emerald-800 hover:bg-emerald-100":"bg-slate-100 text-slate-600 hover:bg-slate-100"}>{method.isActive ? "Aktif" : "Pasif"}</Badge></td><td className="px-5 py-4 text-right md:px-7"><Button size="sm" variant="outline" onClick={() => edit(method)}><Pencil className="mr-1.5 size-3.5" />Düzenle</Button><Button size="sm" variant="outline" className="ml-2" onClick={() => setRateMethodId(method.id)}><MapPin className="mr-1.5 size-3.5" />Bölgesel kurallar</Button><Button size="icon" variant="ghost" className="ml-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteTarget(method)}><Trash2 className="size-4" /></Button></td></tr>):<tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground"><PackageCheck className="mx-auto mb-3 size-7 text-slate-300" />Henüz kargo yöntemi yok.</td></tr>}</tbody></table></div></Card>
    {rateMethodId && <RateOverridesPanel method={methods.find(method => method.id === rateMethodId)!} onClose={() => setRateMethodId(null)} />}
    <AlertDialog open={!!deleteTarget} onOpenChange={open=>!open&&setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Kargo yöntemi pasife alınsın mı?</AlertDialogTitle><AlertDialogDescription>Bu yöntem müşterilere checkout aşamasında gösterilmez. Kayıt silinmez; gerektiğinde yeniden düzenlenebilir.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={()=>void remove()}><Trash2 className="mr-2 size-4" />Pasife al</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>
}

function RateOverridesPanel({ method, onClose }: { method: ShippingMethod; onClose: () => void }) {
  const empty = { city: "", district: "", price: "", freeShippingThreshold: "", isActive: true }
  const [items, setItems] = useState<RateOverride[]>([]); const [form, setForm] = useState(empty); const [editing, setEditing] = useState<number | null>(null)
  const load = async () => setItems((await fetchApi<ApiResponse<RateOverride[]>>(`/admin/shipping-methods/${method.id}/rate-overrides`)).data ?? [])
  useEffect(() => { load().catch(() => setItems([])) }, [method.id])
  const save = async () => { const payload = { city: form.city, district: form.district || null, price: form.price === "" ? null : Number(form.price), freeShippingThreshold: form.freeShippingThreshold === "" ? null : Number(form.freeShippingThreshold), isActive: form.isActive }; await fetchApi(editing ? `/admin/shipping-methods/rate-overrides/${editing}` : `/admin/shipping-methods/${method.id}/rate-overrides`, { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) }); setForm(empty); setEditing(null); await load() }
  return <Card className="space-y-4 p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{method.name}: bölgesel kargo kuralı</h2><p className="text-sm text-muted-foreground">İlçe boş bırakılırsa tüm il için geçerlidir.</p></div><Button variant="outline" onClick={onClose}>Kapat</Button></div><div className="grid gap-3 md:grid-cols-4"><Input placeholder="İl" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><Input placeholder="İlçe (opsiyonel)" value={form.district} onChange={e=>setForm({...form,district:e.target.value})}/><Input type="number" placeholder="Ücret (₺)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/><Input type="number" placeholder="Ücretsiz kargo eşiği" value={form.freeShippingThreshold} onChange={e=>setForm({...form,freeShippingThreshold:e.target.value})}/></div><div className="flex gap-2"><Button onClick={save} disabled={!form.city || (form.price === "" && form.freeShippingThreshold === "")}>{editing ? "Güncelle" : "Kural ekle"}</Button>{editing && <Button variant="outline" onClick={()=>{setEditing(null);setForm(empty)}}>İptal</Button>}</div><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">İl / ilçe</th><th className="p-2">Ücret</th><th className="p-2">Eşik</th><th/></tr></thead><tbody>{items.map(item=><tr key={item.id} className="border-b"><td className="p-2">{item.city}{item.district ? ` / ${item.district}` : ""}</td><td className="p-2">{item.price == null ? "Genel ücret" : `₺${item.price}`}</td><td className="p-2">{item.freeShippingThreshold == null ? "Genel eşik" : `₺${item.freeShippingThreshold}`}</td><td className="p-2 text-right"><Button size="sm" variant="outline" onClick={()=>{setEditing(item.id);setForm({city:item.city,district:item.district??"",price:item.price?.toString()??"",freeShippingThreshold:item.freeShippingThreshold?.toString()??"",isActive:item.isActive})}}>Düzenle</Button><Button size="sm" variant="ghost" onClick={async()=>{await fetchApi(`/admin/shipping-methods/rate-overrides/${item.id}`,{method:"DELETE"});await load()}}>Sil</Button></td></tr>)}</tbody></table></Card>
}
