"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApiNoAutoLogout as fetchApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { BarChart3, CheckCircle2, Save } from "lucide-react"
import type { MarketingSettings } from "@/lib/types"

export default function AnalyticsAndPixelsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<MarketingSettings>({
    gtmContainerId: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
    tikTokPixelId: "",
    metaConversionApiKey: "",
    isGTMEnabled: false,
    isGAEnabled: false,
    isFacebookEnabled: false,
    isTikTokEnabled: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchApi<MarketingSettings>("/marketing/settings")
        setSettings({
          gtmContainerId: data.gtmContainerId ?? "",
          googleAnalyticsId: data.googleAnalyticsId ?? "",
          facebookPixelId: data.facebookPixelId ?? "",
          tikTokPixelId: data.tikTokPixelId ?? "",
          metaConversionApiKey: data.metaConversionApiKey ?? "",
          isGTMEnabled: data.isGTMEnabled ?? false,
          isGAEnabled: data.isGAEnabled ?? false,
          isFacebookEnabled: data.isFacebookEnabled ?? false,
          isTikTokEnabled: data.isTikTokEnabled ?? false,
          id: data.id,
          updatedAt: data.updatedAt ?? null,
          updatedBy: data.updatedBy ?? null,
        })
      } catch (e) {
        const msg = (e as Error)?.message || ""
        if (
          msg.includes("Yetkilendirme") ||
          msg.includes("Token") ||
          /404|not found/i.test(msg)
        ) {
          // İlk girişte kayıt olmayabilir; 404 ise uyarı göstermeden formu boş bırak
          return
        }
        setMessage("Ayarlar yüklenemedi.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      await fetchApi<MarketingSettings>("/admin/marketing/settings", {
        method: "POST",
        body: JSON.stringify({
          GTMContainerId: settings.gtmContainerId || null,
          GoogleAnalyticsId: settings.googleAnalyticsId || null,
          FacebookPixelId: settings.facebookPixelId || null,
          TikTokPixelId: settings.tikTokPixelId || null,
          MetaConversionApiKey: settings.metaConversionApiKey || null,
          IsGTMEnabled: settings.isGTMEnabled,
          IsGAEnabled: settings.isGAEnabled,
          IsFacebookEnabled: settings.isFacebookEnabled,
          IsTikTokEnabled: settings.isTikTokEnabled,
        }),
      })
      setMessage("Ayarlar kaydedildi.")
      try {
        const data = await fetchApi<MarketingSettings>("/marketing/settings")
        setSettings({
          gtmContainerId: data.gtmContainerId ?? "",
          googleAnalyticsId: data.googleAnalyticsId ?? "",
          facebookPixelId: data.facebookPixelId ?? "",
          tikTokPixelId: data.tikTokPixelId ?? "",
          metaConversionApiKey: data.metaConversionApiKey ?? "",
          isGTMEnabled: data.isGTMEnabled ?? false,
          isGAEnabled: data.isGAEnabled ?? false,
          isFacebookEnabled: data.isFacebookEnabled ?? false,
          isTikTokEnabled: data.isTikTokEnabled ?? false,
          id: data.id,
          updatedAt: data.updatedAt ?? null,
          updatedBy: data.updatedBy ?? null,
        })
      } catch {}
    } catch (e) {
      const msg = (e as Error)?.message || ""
      if (
        msg.includes("Yetkilendirme") ||
        msg.includes("Token")
      ) {
        return
      }
      setMessage("Ayarlar kaydedilemedi.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-blue-200"><BarChart3 className="size-4" />Pazarlama ölçümü</div><h1 className="text-3xl font-bold tracking-tight">Analytics & Pixels</h1><p className="mt-2 text-sm text-slate-300">Tarayıcı tarafı pixel ve analiz bağlantılarını platform bazında yönetin.</p></div><div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xs text-slate-300">Etkin bağlantı</p><p className="mt-1 text-xl font-semibold">{[settings.isGTMEnabled,settings.isGAEnabled,settings.isFacebookEnabled,settings.isTikTokEnabled].filter(Boolean).length} / 4</p></div></div></div>
      {message&&<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"><CheckCircle2 className="size-4" />{message}</div>}
      <div className="flex items-center justify-between px-1">
        <div><h2 className="font-semibold text-slate-900">Platform bağlantıları</h2><p className="text-sm text-muted-foreground">Kimlikleri ekleyin, sonra ilgili bağlantıyı etkinleştirin.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>Vazgeç</Button>
          <Button onClick={handleSave} disabled={loading}><Save className="mr-2 size-4" />Kaydet</Button>
        </div>
      </div>

      <Card className="border-slate-200 p-6 space-y-6 shadow-sm">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Google Tag Manager</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="gtm">GTM Container ID</Label>
              <Input id="gtm" value={settings.gtmContainerId ?? ""} onChange={e => setSettings(s => ({ ...s, gtmContainerId: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch id="gtm-enabled" checked={settings.isGTMEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, isGTMEnabled: v }))} />
              <Label htmlFor="gtm-enabled">Etkin</Label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Google Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="ga">GA Measurement ID</Label>
              <Input id="ga" value={settings.googleAnalyticsId ?? ""} onChange={e => setSettings(s => ({ ...s, googleAnalyticsId: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch id="ga-enabled" checked={settings.isGAEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, isGAEnabled: v }))} />
              <Label htmlFor="ga-enabled">Etkin</Label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Facebook Pixel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="fb">Facebook Pixel ID</Label>
              <Input id="fb" value={settings.facebookPixelId ?? ""} onChange={e => setSettings(s => ({ ...s, facebookPixelId: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch id="fb-enabled" checked={settings.isFacebookEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, isFacebookEnabled: v }))} />
              <Label htmlFor="fb-enabled">Etkin</Label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">TikTok Pixel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="tt">TikTok Pixel ID</Label>
              <Input id="tt" value={settings.tikTokPixelId ?? ""} onChange={e => setSettings(s => ({ ...s, tikTokPixelId: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch id="tt-enabled" checked={settings.isTikTokEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, isTikTokEnabled: v }))} />
              <Label htmlFor="tt-enabled">Etkin</Label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Meta Conversion API</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label htmlFor="meta">Meta Conversion API Key</Label>
              <Input id="meta" value={settings.metaConversionApiKey ?? ""} onChange={e => setSettings(s => ({ ...s, metaConversionApiKey: e.target.value }))} />
            </div>
          </div>
        </section>
      </Card>
    </div>
  )
}
