"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { CheckCircle2, Eye, Mail, Save, Send } from "lucide-react"
import { fetchApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false })

type TemplateKey = "welcome" | "email-verification" | "marketing-opt-in" | "order-paid"
type Template = { templateKey: TemplateKey; subject: string; htmlBody: string; isActive: boolean }
const labels: Record<TemplateKey, string> = { welcome: "Hoş geldiniz", "email-verification": "Üyelik e-posta doğrulaması", "marketing-opt-in": "Bülten çift onayı", "order-paid": "Ödeme başarılı" }
const tokens: Record<TemplateKey, string[]> = { welcome: ["{customerName}"], "email-verification": ["{customerName}", "{verificationUrl}"], "marketing-opt-in": ["{confirmationUrl}"], "order-paid": ["{customerName}", "{orderNumber}", "{orderItems}", "{orderTotal}"] }
const examples: Record<Template["templateKey"], Record<string, string>> = {
  welcome: { customerName: "Ayşe Yılmaz" },
  "email-verification": { customerName: "Ayşe Yılmaz", verificationUrl: "https://www.kombiklimaburada.com/account/verify-email?token=..." },
  "marketing-opt-in": { confirmationUrl: "https://www.kombiklimaburada.com/newsletter/confirm?token=..." },
  "order-paid": { customerName: "Ayşe Yılmaz", orderNumber: "ORD202609270001", orderItems: "<li>İsimli Bebek Makosen × 1</li>", orderTotal: "1.250,00 ₺" },
}
const render = (value: string, key: Template["templateKey"]) => Object.entries(examples[key]).reduce((result, [token, replacement]) => result.replaceAll(`{${token}}`, replacement), value)

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<TemplateKey>("welcome")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const template = useMemo(() => templates.find(item => item.templateKey === selected), [selected, templates])

  useEffect(() => { void (async () => { try { setTemplates(await fetchApi<Template[]>("/admin/email-templates")) } catch { setMessage("E-posta şablonları yüklenemedi.") } })() }, [])
  const update = (partial: Partial<Template>) => setTemplates(items => items.map(item => item.templateKey === selected ? { ...item, ...partial } : item))
  const save = async () => { if (!template) return; setSaving(true); try { await fetchApi(`/admin/email-templates/${template.templateKey}`, { method: "PUT", body: JSON.stringify(template) }); setMessage("Şablon kaydedildi.") } catch { setMessage("Şablon kaydedilemedi.") } finally { setSaving(false) } }

  if (!template) return <div className="p-8 text-muted-foreground">Şablonlar yükleniyor…</div>
  return <main className="mx-auto max-w-7xl space-y-6 pb-10">
    <section className="rounded-2xl bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-violet-200"><Mail className="size-4"/>Müşteri iletişimi</div><h1 className="text-3xl font-bold">E-posta şablonları</h1><p className="mt-2 text-sm text-slate-300">Üyelik, çift onay ve ödeme e-postalarını zengin içerikle yönetin.</p></div><Button onClick={save} disabled={saving}><Save className="mr-2 size-4"/>{saving ? "Kaydediliyor…" : "Kaydet"}</Button></div></section>
    {message && <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900"><CheckCircle2 className="size-4"/>{message}</div>}
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit overflow-hidden border-slate-200 p-2 shadow-sm">{templates.map(item => <button key={item.templateKey} onClick={() => setSelected(item.templateKey)} className={`w-full rounded-lg p-4 text-left transition ${selected === item.templateKey ? "bg-violet-100 text-violet-950" : "hover:bg-slate-50"}`}><div className="flex items-center justify-between font-semibold">{labels[item.templateKey]}<Badge variant="outline" className={item.isActive ? "border-emerald-300 text-emerald-700" : "border-slate-300 text-slate-500"}>{item.isActive ? "Aktif" : "Pasif"}</Badge></div><p className="mt-1 text-xs text-slate-500">{item.subject}</p></button>)}</Card>
      <div className="space-y-6"><Card className="border-slate-200 p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold text-slate-900">{labels[selected]} e-postası</h2><p className="mt-1 text-sm text-muted-foreground">Değişkenler gönderim anında müşteri ve sipariş verileriyle doldurulur.</p></div><div className="flex items-center gap-3"><Switch checked={template.isActive} onCheckedChange={isActive => update({ isActive })}/><span className="text-sm font-medium">Gönderimi etkinleştir</span></div></div><div className="mt-6 space-y-2"><Label>Konu</Label><Input value={template.subject} onChange={event => update({ subject: event.target.value })}/></div><div className="mt-6 space-y-2"><Label>İçerik</Label><RichTextEditor value={template.htmlBody} onChange={htmlBody => update({ htmlBody })}/></div><div className="mt-6 rounded-xl border border-violet-100 bg-violet-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-violet-950"><Send className="size-4"/>Kullanılabilir değişkenler</p><div className="mt-3 flex flex-wrap gap-2">{tokens[selected].map(token => <button key={token} type="button" onClick={() => update({ htmlBody: `${template.htmlBody}<p>${token}</p>` })} className="rounded-md bg-white px-2 py-1 font-mono text-xs text-violet-800 shadow-sm hover:bg-violet-100">{token}</button>)}</div></div></Card>
      <Card className="border-slate-200 p-6 shadow-sm"><div className="flex items-center gap-2"><Eye className="size-4 text-violet-700"/><h2 className="font-bold text-slate-900">Canlı önizleme</h2></div><div className="mt-4 rounded-xl border bg-white p-6"><p className="border-b pb-3 text-lg font-bold">{render(template.subject, selected)}</p><div className="prose prose-sm mt-5 max-w-none" dangerouslySetInnerHTML={{ __html: render(template.htmlBody, selected) }}/></div></Card></div>
    </div>
  </main>
}
