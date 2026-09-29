"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { CheckCircle2, MessageCircle, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type WhatsAppSettings = {
  id?: number
  isEnabled: boolean
  phoneNumber?: string | null
  productTemplate?: string | null
  cartTemplate?: string | null
  checkoutTemplate?: string | null
}

export default function WhatsAppSettingsPage() {
  const router = useRouter()
  const [isEnabled, setIsEnabled] = useState(false)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [productTpl, setProductTpl] = useState("")
  const [cartTpl, setCartTpl] = useState("")
  const [checkoutTpl, setCheckoutTpl] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchApi<WhatsAppSettings>("/admin/whatsapp/settings")
        setIsEnabled(!!s.isEnabled)
        setPhone(s.phoneNumber ?? "")
        setProductTpl(s.productTemplate ?? "Merhaba, {productName} ürünü hakkında bilgi almak istiyorum. Ürün linki: {productUrl}")
        setCartTpl(s.cartTemplate ?? "Merhaba, sepetim hakkında bilgi almak istiyorum. Sepet linki: {cartUrl}")
        setCheckoutTpl(s.checkoutTemplate ?? "Merhaba, sipariş/ödeme hakkında destek rica ediyorum. Checkout linki: {checkoutUrl}")
      } catch {
        setMessage("WhatsApp ayarları yüklenemedi.")
      }
    })()
  }, [])

  const save = async () => {
    setLoading(true)
    try {
      await fetchApi("/admin/whatsapp/settings", {
        method: "POST",
        body: JSON.stringify({ isEnabled, phoneNumber: phone, productTemplate: productTpl, cartTemplate: cartTpl, checkoutTemplate: checkoutTpl }),
      })
      setMessage("WhatsApp ayarları kaydedildi.")
    } catch {
      setMessage("WhatsApp ayarları kaydedilemedi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-emerald-200"><MessageCircle className="size-4" />Müşteri iletişimi</div><h1 className="text-3xl font-bold tracking-tight">WhatsApp ayarları</h1><p className="mt-2 text-sm text-slate-300">Ürün, sepet ve ödeme noktalarındaki müşteri destek mesajlarını yönetin.</p></div><Badge className={isEnabled?"bg-emerald-100 text-emerald-800 hover:bg-emerald-100":"bg-white/10 text-white hover:bg-white/10"}>{isEnabled?"Canlı destek etkin":"Canlı destek pasif"}</Badge></div></div>
      {message&&<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><CheckCircle2 className="size-4" />{message}</div>}
      <div className="flex items-center justify-between px-1"><div><h2 className="font-semibold text-slate-900">Mesaj yapılandırması</h2><p className="text-sm text-muted-foreground">Şablonlarda sadece belirtilen değişkenleri kullanın.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>Vazgeç</Button>
          <Button onClick={save} disabled={loading}><Save className="mr-2 size-4" />Kaydet</Button>
        </div>
      </div>

      <Card className="border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-xl bg-emerald-50/50 p-4">
          <div className="space-y-2">
            <Label htmlFor="waPhone">Telefon Numarası (ülke kodu ile)</Label>
            <Input id="waPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="örn: 905555555555" />
          </div>
          <div className="space-y-2 flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="waEnabled">Aktif</Label>
              <div className="flex items-center gap-2">
                <Switch id="waEnabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
                <span>{isEnabled ? "Aktif" : "Pasif"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="productTpl">Ürün Mesaj Şablonu</Label>
            <textarea id="productTpl" className="w-full rounded-md border p-2 h-28" value={productTpl} onChange={(e) => setProductTpl(e.target.value)} />
            <p className="text-xs text-gray-500">Kullanılabilir: {'{productName}'} {'{productUrl}'}</p>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="cartTpl">Sepet Mesaj Şablonu</Label>
            <textarea id="cartTpl" className="w-full rounded-md border p-2 h-28" value={cartTpl} onChange={(e) => setCartTpl(e.target.value)} />
            <p className="text-xs text-gray-500">Kullanılabilir: {'{cartUrl}'}</p>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="checkoutTpl">Ödeme Mesaj Şablonu</Label>
            <textarea id="checkoutTpl" className="w-full rounded-md border p-2 h-28" value={checkoutTpl} onChange={(e) => setCheckoutTpl(e.target.value)} />
            <p className="text-xs text-gray-500">Kullanılabilir: {'{checkoutUrl}'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
