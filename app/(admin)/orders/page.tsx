"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Archive, CalendarDays, ChevronLeft, ChevronRight, Download, PackageCheck, PackageSearch, Pencil, RotateCcw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ordersApi } from "@/lib/api"
import { Order } from "@/lib/types"

const PAGE_SIZE = 20

const statusOptions = [
  { value: "all", label: "Tüm durumlar" },
  { value: "0", label: "Beklemede" },
  { value: "1", label: "İşleniyor" },
  { value: "2", label: "Kargolandı" },
  { value: "3", label: "Teslim edildi" },
  { value: "4", label: "İptal edildi" },
  { value: "5", label: "Tamamlandı" },
  { value: "6", label: "İade edildi" },
]

function statusClass(status: string) {
  const normalized = status.toLocaleLowerCase("tr-TR")
  if (normalized.includes("iptal") || normalized.includes("cancel")) return "border-red-200 bg-red-50 text-red-700"
  if (normalized.includes("iade") || normalized.includes("return")) return "border-orange-200 bg-orange-50 text-orange-700"
  if (normalized.includes("kargo") || normalized.includes("ship")) return "border-blue-200 bg-blue-50 text-blue-700"
  if (normalized.includes("teslim") || normalized.includes("tamam") || normalized.includes("complete")) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (normalized.includes("bekle") || normalized.includes("pending")) return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [isArchived, setIsArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [summary, setSummary] = useState({ totalAmount: 0, needsAttentionCount: 0, shippedCount: 0 })
  const [exporting, setExporting] = useState(false)

  const activeFilterCount = [search, status !== "all", fromDate, toDate].filter(Boolean).length
  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    status: status === "all" ? undefined : Number(status),
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    isArchived,
  }), [fromDate, isArchived, search, status, toDate])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [response, summaryResponse] = await Promise.all([
        ordersApi.getPagedOrders({ page: pageNumber, pageSize: PAGE_SIZE, ...filters }),
        ordersApi.getSummary(filters),
      ])
      setOrders(response.items ?? [])
      setTotalPages(Math.max(1, response.totalPages ?? 1))
      setTotalCount(response.totalCount ?? 0)
      setHasPreviousPage(Boolean(response.hasPreviousPage))
      setHasNextPage(Boolean(response.hasNextPage))
      if (summaryResponse.data) setSummary(summaryResponse.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Siparişler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [filters, pageNumber])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  const resetFilters = () => {
    setSearch(""); setStatus("all"); setFromDate(""); setToDate(""); setPageNumber(1)
  }
  const switchArchive = (archived: boolean) => {
    setIsArchived(archived); setPageNumber(1)
  }
  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await ordersApi.exportOrders(filters)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sipariş raporu indirilemedi")
    } finally {
      setExporting(false)
    }
  }
  const handleRestore = async (id: number) => {
    try { await ordersApi.restoreOrder(id); await fetchOrders() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Sipariş geri alınamadı") }
  }
  const formatCurrency = (value: number) => value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
  const formatDate = (date: string) => new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  const pageButtons = useMemo(() => {
    const start = Math.max(1, Math.min(pageNumber - 2, Math.max(1, totalPages - 4)))
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index)
  }, [pageNumber, totalPages])

  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <section className="rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="mb-3 flex items-center gap-2 text-sm text-blue-200"><PackageCheck className="size-4" />Sipariş operasyonu</div><h1 className="text-3xl font-bold tracking-tight">{isArchived ? "Sipariş Arşivi" : "Siparişler"}</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Sipariş akışını, teslimat durumlarını ve operasyon önceliklerini tek ekrandan yönetin.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant={isArchived ? "outline" : "secondary"} className={!isArchived ? "bg-white text-slate-900 hover:bg-slate-100" : "border-white/25 bg-transparent text-white hover:bg-white/10"} onClick={() => switchArchive(false)}>Aktif siparişler</Button><Button variant={isArchived ? "secondary" : "outline"} className={isArchived ? "bg-white text-slate-900 hover:bg-slate-100" : "border-white/25 bg-transparent text-white hover:bg-white/10"} onClick={() => switchArchive(true)}><Archive className="mr-2 h-4 w-4" />Arşiv</Button><Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10" onClick={handleExport} disabled={exporting}><Download className="mr-2 h-4 w-4" />{exporting ? "Hazırlanıyor..." : "CSV indir"}</Button></div>
      </div>
      <div className="mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"><div><p className="text-xs text-slate-400">Toplam sipariş</p><p className="mt-1 text-2xl font-semibold">{totalCount}</p></div><div><p className="text-xs text-slate-400">Toplam tutar</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(summary.totalAmount)}</p></div><div><p className="text-xs text-slate-400">İşlem bekleyen</p><p className="mt-1 text-2xl font-semibold">{summary.needsAttentionCount}</p></div></div>
    </section>

    <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="space-y-4 border-b p-5 md:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Sipariş listesi</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Arama ve filtreler anlık olarak sipariş listesini günceller.</p></div><Badge variant="secondary">{totalCount} kayıt</Badge></div>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-2 xl:grid-cols-5"><div className="relative xl:col-span-2"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Sipariş no veya müşteri ara..." className="pl-8" value={search} onChange={event => { setSearch(event.target.value); setPageNumber(1) }} /></div><Select value={status} onValueChange={value => { setStatus(value); setPageNumber(1) }}><SelectTrigger><SelectValue placeholder="Durum" /></SelectTrigger><SelectContent>{statusOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><div className="relative"><CalendarDays className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="date" aria-label="Başlangıç tarihi" className="pl-8" value={fromDate} onChange={event => { setFromDate(event.target.value); setPageNumber(1) }} /></div><div className="relative"><CalendarDays className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="date" aria-label="Bitiş tarihi" className="pl-8" value={toDate} onChange={event => { setToDate(event.target.value); setPageNumber(1) }} /></div></div>
      {activeFilterCount > 0 && <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"><span>{activeFilterCount} filtre etkin</span><Button variant="ghost" size="sm" onClick={resetFilters}><X className="mr-1 h-4 w-4" />Temizle</Button></div>}
    </CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Sipariş no</TableHead><TableHead>Müşteri</TableHead><TableHead>Tarih</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">Tutar</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader><TableBody>{loading ? Array.from({ length: 6 }, (_, index) => <TableRow key={index}><TableCell colSpan={6} className="h-14 animate-pulse bg-slate-50/60" /></TableRow>) : orders.length === 0 ? <TableRow><TableCell colSpan={6} className="py-16 text-center"><PackageSearch className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-700">Sipariş bulunamadı</p><p className="mt-1 text-sm text-muted-foreground">Arama ve filtre ölçütlerinizi değiştirip tekrar deneyin.</p></TableCell></TableRow> : orders.map(order => <TableRow key={order.id} className={!isArchived ? "cursor-pointer transition-colors hover:bg-slate-50" : ""} onClick={() => !isArchived && router.push(`/orders/edit/${order.id}`)}><TableCell className="font-mono text-sm font-semibold text-blue-700">{order.orderNumber}</TableCell><TableCell><div className="font-medium text-slate-900">{order.fullName}</div></TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(order.createDate)}</TableCell><TableCell><Badge variant="outline" className={statusClass(order.orderStatusName)}>{order.orderStatusName}</Badge></TableCell><TableCell className="text-right font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</TableCell><TableCell className="text-right">{isArchived ? <Button size="sm" variant="outline" title="Arşivden çıkar" onClick={event => { event.stopPropagation(); void handleRestore(order.id) }}><RotateCcw className="h-4 w-4" /></Button> : <Button size="sm" variant="outline" title="Siparişi düzenle" onClick={event => { event.stopPropagation(); router.push(`/orders/edit/${order.id}`) }}><Pencil className="h-4 w-4" /></Button>}</TableCell></TableRow>)}</TableBody></Table></div>
      {totalPages > 1 && <nav aria-label="Sipariş sayfalaması" className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"><p className="text-sm text-muted-foreground">Sayfa <span className="font-medium text-foreground">{pageNumber}</span> / {totalPages}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!hasPreviousPage || loading} onClick={() => setPageNumber(current => current - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Önceki</Button>{pageButtons.map(value => <Button key={value} size="sm" variant={value === pageNumber ? "default" : "outline"} disabled={loading} onClick={() => setPageNumber(value)}>{value}</Button>)}<Button size="sm" variant="outline" disabled={!hasNextPage || loading} onClick={() => setPageNumber(current => current + 1)}>Sonraki<ChevronRight className="ml-1 h-4 w-4" /></Button></div></nav>}
    </CardContent></Card>
  </div>
}
