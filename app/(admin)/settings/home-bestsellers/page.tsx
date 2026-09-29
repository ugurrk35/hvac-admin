"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Search, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ProductListItem = {
  id: number
  name: string
  slug: string
  price?: number
  imageUrl?: string | null
  imageAlt?: string | null
  categoryName?: string | null
}

type PagedProducts = {
  items: ProductListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

type AdminHomeBestsellersSettings = {
  id?: number
  title?: string | null
  isEnabled: boolean
  productIdsJson?: string | null
}

export default function HomeBestsellersSettingsPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [isEnabled, setIsEnabled] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectedItems, setSelectedItems] = useState<ProductListItem[]>([])
  const [maxItems, setMaxItems] = useState<number>(4)
  const [gridColumns, setGridColumns] = useState<number>(4)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [resultPage, setResultPage] = useState(1)
  const [resultTotalPages, setResultTotalPages] = useState(0)
  const [message, setMessage] = useState("")
  const pageSize = 10

  useEffect(() => {
    ;(async () => {
      try {
        const s = await fetchApi<AdminHomeBestsellersSettings & { maxItems?: number; gridColumns?: number }>("/admin/home/settings/bestsellers")
        setTitle(s.title ?? "Çok Satanlar")
        setIsEnabled(s.isEnabled ?? false)
        setMaxItems(Math.min(Math.max(Number(s.maxItems ?? 4), 1), 8))
        setGridColumns(Math.min(Math.max(Number(s.gridColumns ?? 4), 2), 4))
        try {
          const ids = s.productIdsJson ? (JSON.parse(s.productIdsJson) as number[]) : []
          const limit = Math.min(Math.max(Number(s.maxItems ?? 4), 1), 8)
          const limited = ids.slice(0, limit)
          setSelectedIds(limited)
          if (limited.length) {
            const res = await fetchApi<{ data: ProductListItem[]; success: boolean }>(`/Product/by-ids?ids=${limited.join(',')}`)
            setSelectedItems(res.data ?? [])
          }
        } catch {
          setSelectedIds([])
          setSelectedItems([])
        }
      } catch {
        alert("Ayarlar yüklenemedi")
      }
    })()
  }, [])

  const search = async (term: string, page: number, signal?: AbortSignal) => {
    setLoading(true)
    try {
      const resp = await fetchApi<PagedProducts>(`/admin/AdminProduct?pageNumber=${page}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(term)}`, { signal })
      setResults(resp.items || [])
      setResultTotalPages(resp.totalPages || 0)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      alert("Ürünler yüklenemedi")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const term = query.trim()
    setResultPage(1)
    if (term.length < 3) {
      setResults([])
      setResultTotalPages(0)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => void search(term, 1, controller.signal), 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const changeResultPage = async (page: number) => {
    const term = query.trim()
    if (term.length < 3 || page < 1 || page > resultTotalPages) return
    setResultPage(page)
    await search(term, page)
  }

  const addProduct = (p: ProductListItem) => {
    setSelectedIds((prev) => {
      if (prev.includes(p.id) || prev.length >= maxItems) return prev
      return [...prev, p.id]
    })
    setSelectedItems((prev) => {
      if (prev.find(x => x.id === p.id) || prev.length >= maxItems) return prev
      return [...prev, p]
    })
  }
  const removeProduct = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    setSelectedItems((prev) => prev.filter((x) => x.id !== id))
  }
  const moveIndex = (from: number, to: number) => {
    setSelectedIds((prev) => {
      const copy = [...prev]
      const [spliced] = copy.splice(from, 1)
      copy.splice(to, 0, spliced)
      return copy
    })
    setSelectedItems((prev) => {
      const copy = [...prev]
      const [spliced] = copy.splice(from, 1)
      copy.splice(to, 0, spliced)
      return copy
    })
  }
  const moveUp = (id: number) => {
    const idx = selectedIds.indexOf(id)
    if (idx > 0) moveIndex(idx, idx - 1)
  }
  const moveDown = (id: number) => {
    const idx = selectedIds.indexOf(id)
    if (idx >= 0 && idx < selectedIds.length - 1) moveIndex(idx, idx + 1)
  }

  // Drag & drop removed; use ↑/↓ buttons for ordering

  const handleSave = async () => {
    try {
      await fetchApi("/admin/home/settings/bestsellers", {
        method: "POST",
        body: JSON.stringify({
          title: title?.trim() || null,
          isEnabled,
          productIds: selectedIds,
          maxItems,
          gridColumns,
        }),
      })
      setMessage("Anasayfa bloğu kaydedildi.")
    } catch {
      setMessage("Ayarlar kaydedilemedi.")
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex items-end justify-between gap-5"><div><div className="mb-3 flex items-center gap-2 text-sm text-amber-200"><Trophy className="size-4" />Anasayfa vitrini</div><h1 className="text-3xl font-bold tracking-tight">Çok Satanlar</h1><p className="mt-2 text-sm text-slate-300">Satış potansiyeli yüksek ürünleri seçin, sıralayın ve müşterilerinize öne çıkarın.</p></div><div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-xs text-slate-300">Seçilen ürün</p><p className="mt-1 text-xl font-semibold">{selectedIds.length} / {maxItems}</p></div></div></div>
      {message&&<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><CheckCircle2 className="size-4" />{message}</div>}
      <div className="flex items-center justify-between px-1">
        <div><h2 className="font-semibold text-slate-900">Blok yapılandırması</h2><p className="text-sm text-muted-foreground">Sıralama, vitrinde soldan sağa uygulanır.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Vazgeç</Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </div>
      </div>

      <Card className="border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Çok Satanlar" />
          </div>
          <div className="space-y-2 flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="enabled">Aktif</Label>
              <div className="flex items-center gap-2">
                <Switch id="enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
                <span>{isEnabled ? "Aktif" : "Pasif"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxItems">Maksimum Ürün</Label>
            <Input id="maxItems" type="number" min={1} max={8} value={maxItems} onChange={(e) => setMaxItems(Math.min(Math.max(Number(e.target.value),1),8))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gridColumns">Grid Kolon (lg)</Label>
            <Input id="gridColumns" type="number" min={2} max={4} value={gridColumns} onChange={(e) => setGridColumns(Math.min(Math.max(Number(e.target.value),2),4))} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label>Ürün seçimi</Label><Badge variant="secondary">{selectedIds.length} / {maxItems} seçili</Badge></div>
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 pr-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün adından en az 3 harf yazın..." autoComplete="off" />
              {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex min-h-8 items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{query.trim().length < 3 ? "Arama için en az 3 harf yazın." : loading ? "Ürünler aranıyor…" : `${results.length} ürün listelendi.`}</p>
              {resultTotalPages > 1 && <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void changeResultPage(resultPage - 1)} disabled={loading || resultPage <= 1}>Önceki</Button>
                <span className="text-xs text-gray-500">{resultPage} / {resultTotalPages}</span>
                <Button variant="outline" size="sm" onClick={() => void changeResultPage(resultPage + 1)} disabled={loading || resultPage >= resultTotalPages}>Sonraki</Button>
              </div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Sonuçlar</h3>
              <div className="space-y-2 max-h-72 overflow-auto border rounded p-2">
                {results.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.imageAlt ?? p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">{p.name}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                          {p.categoryName && (<span className="px-1.5 py-0.5 bg-gray-100 rounded">{p.categoryName}</span>)}
                          {typeof p.price === 'number' && (<span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.price)}</span>)}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addProduct(p)} disabled={selectedIds.includes(p.id) || selectedIds.length >= maxItems}>Ekle</Button>
                  </div>
                ))}
                {!loading && results.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-500">{query.trim().length < 3 ? "Aramaya başlamak için ürün adını yazın." : "Eşleşen ürün bulunamadı."}</div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Seçilenler</h3>
              <div className="space-y-2 max-h-72 overflow-auto border rounded p-2">
                {selectedItems.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="w-6 text-xs text-gray-500">{idx + 1}.</span>
                    <div className="relative w-10 h-10 rounded bg-gray-100 overflow-hidden">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.imageAlt ?? p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate">{p.name}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-2">
                        {p.categoryName && (<span className="px-1.5 py-0.5 bg-gray-100 rounded">{p.categoryName}</span>)}
                        {typeof p.price === 'number' && (<span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(p.price)}</span>)}
                      </div>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => moveUp(p.id)} disabled={idx === 0}>↑</Button>
                      <Button size="sm" variant="outline" onClick={() => moveDown(p.id)} disabled={idx === selectedIds.length - 1}>↓</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeProduct(p.id)}>Sil</Button>
                    </div>
                  </div>
                ))}
                {selectedIds.length === 0 && (
                  <div className="text-xs text-gray-500">Henüz seçim yok</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
