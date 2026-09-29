"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ClipboardCheck, Eye, MessageSquareText, Search, Star, Trash2, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { reviewsAdminApi } from "@/lib/api"
import type { AdminReviewListItem } from "@/lib/types"

type Status = "pending" | "approved" | "all"
const stars = (rating:number) => <span className="inline-flex gap-0.5 text-amber-400" aria-label={`${rating} yıldız`}>{Array.from({ length:5 }, (_, index) => <Star key={index} className={`size-3.5 ${index < rating ? "fill-current" : "text-slate-200"}`} />)}</span>

export default function AdminProductCommentsPage() {
  const [items, setItems] = useState<AdminReviewListItem[]>([])
  const [status, setStatus] = useState<Status>("pending")
  const [query, setQuery] = useState("")
  const [rating, setRating] = useState("all")
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewListItem | null>(null)

  const load = async (nextStatus = status) => {
    setLoading(true)
    try {
      const response = nextStatus === "all" ? await reviewsAdminApi.list() : await reviewsAdminApi.list(nextStatus)
      setItems(response?.data ?? [])
    } catch (error) { setMessage(error instanceof Error ? error.message : "Yorumlar yüklenemedi.") } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [status])
  const visible = useMemo(() => items.filter(item => {
    const haystack = `${item.title} ${item.content} ${item.authorName ?? ""} ${item.productId}`.toLocaleLowerCase("tr-TR")
    return haystack.includes(query.toLocaleLowerCase("tr-TR")) && (rating === "all" || item.rating === Number(rating))
  }), [items, query, rating])
  const pending = items.filter(item => !item.isApproved).length
  const average = items.length ? (items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1) : "—"
  const approve = async (id:number) => { try { await reviewsAdminApi.approve(id); setMessage("Yorum yayına alındı."); await load() } catch (error) { setMessage(error instanceof Error ? error.message : "Yorum onaylanamadı.") } }
  const remove = async () => { if (!reviewToDelete) return; try { await reviewsAdminApi.delete(reviewToDelete.id); setMessage("Yorum reddedildi ve silindi."); setReviewToDelete(null); await load() } catch (error) { setMessage(error instanceof Error ? error.message : "Yorum silinemedi.") } }
  const changeStatus = (value:Status) => { setStatus(value); setQuery(""); setRating("all") }

  return <main className="mx-auto max-w-7xl space-y-6 pb-10">
    <div className="rounded-2xl bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-violet-200"><MessageSquareText className="size-4" />Müşteri deneyimi</div><h1 className="text-3xl font-bold tracking-tight">Ürün yorumları</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Müşteri yorumlarını inceleyin, yayınlayın veya mağaza kalitesini korumak için reddedin.</p></div><Button variant="secondary" onClick={() => void load()} disabled={loading}>Yenile</Button></div><div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">İncelenecek</p><p className="mt-1 text-xl font-semibold">{pending}</p></div><div><p className="text-xs text-slate-400">Bu görünümde</p><p className="mt-1 text-xl font-semibold">{items.length}</p></div><div><p className="text-xs text-slate-400">Ortalama puan</p><p className="mt-1 text-xl font-semibold">{average} / 5</p></div></div></div>
    {message && <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900"><Check className="size-4" />{message}</div>}
    <Card className="border-slate-200 p-4 shadow-sm md:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">{([ ["pending","İncelenecek"], ["approved","Yayında"], ["all","Tümü"] ] as Array<[Status,string]>).map(([value,label]) => <Button key={value} size="sm" variant={status === value ? "default" : "outline"} onClick={() => changeStatus(value)}>{label}{value === "pending" && status === "pending" && pending > 0 ? <Badge className="ml-2 bg-white/20 text-inherit hover:bg-white/20">{pending}</Badge> : null}</Button>)}</div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-full pl-9 sm:w-72" placeholder="Yorum, müşteri veya ürün ID ara" value={query} onChange={event => setQuery(event.target.value)} /></div><select className="h-10 rounded-md border bg-white px-3 text-sm" value={rating} onChange={event => setRating(event.target.value)}><option value="all">Tüm puanlar</option>{[5,4,3,2,1].map(value => <option key={value} value={value}>{value} yıldız</option>)}</select></div></div></Card>
    <Card className="overflow-hidden border-slate-200 shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 md:px-7">Yorum</th><th className="px-5 py-3">Ürün</th><th className="px-5 py-3">Puan</th><th className="px-5 py-3">Durum</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3 md:px-7" /></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="px-7 py-12 text-center text-muted-foreground">Yorumlar yükleniyor…</td></tr> : visible.length ? visible.map(item => <tr key={item.id} className="border-t align-top transition-colors hover:bg-slate-50/80"><td className="max-w-xl px-5 py-4 md:px-7"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-violet-50 p-2 text-violet-700"><MessageSquareText className="size-4" /></div><div><p className="font-semibold text-slate-900">{item.title || "Başlıksız yorum"}</p><p className="mt-1 line-clamp-2 text-slate-600">{item.content}</p><p className="mt-2 text-xs text-slate-400">{item.authorName || "Misafir müşteri"} · #{item.id}</p></div></div></td><td className="px-5 py-4"><Badge variant="secondary">Ürün #{item.productId}</Badge></td><td className="px-5 py-4">{stars(item.rating)}</td><td className="px-5 py-4"><Badge className={item.isApproved ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>{item.isApproved ? "Yayında" : "İnceleniyor"}</Badge></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("tr-TR") : "—"}</td><td className="px-5 py-4 text-right md:px-7"><div className="flex justify-end gap-2">{!item.isApproved && <Button size="sm" onClick={() => void approve(item.id)}><Check className="mr-1.5 size-3.5" />Onayla</Button>}<Button size="sm" variant="outline" title="Yorumu incele"><Eye className="size-3.5" /></Button><Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setReviewToDelete(item)}><Trash2 className="size-4" /></Button></div></td></tr>) : <tr><td colSpan={6} className="px-7 py-16 text-center"><ClipboardCheck className="mx-auto mb-3 size-8 text-slate-300" /><p className="font-medium text-slate-700">Gösterilecek yorum bulunamadı</p><p className="mt-1 text-sm text-muted-foreground">Filtreleri değiştirebilir veya daha sonra tekrar deneyebilirsiniz.</p></td></tr>}</tbody></table></div></Card>
    <AlertDialog open={!!reviewToDelete} onOpenChange={open => !open && setReviewToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Yorumu reddet?</AlertDialogTitle><AlertDialogDescription>Bu işlem yorumu kalıcı olarak siler. Yayına alınmak üzere yeni bir yorum gerekir.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => void remove()}><X className="mr-2 size-4" />Reddet ve sil</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>
}
