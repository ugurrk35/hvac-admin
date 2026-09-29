"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Search, Pencil, Trash2, PackageSearch, SlidersHorizontal, X, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { categoriesApi, fetchApi, productsApi, ProductListQuery } from "@/lib/api"
import { Category, ProductsResponse } from "@/lib/types"

const PAGE_SIZE = 25
type Filters = { search: string; categoryId: string; publication: "" | "published" | "draft"; stock: "" | "in-stock" | "out-of-stock"; minPrice: string; maxPrice: string; brand: string }
const EMPTY_FILTERS: Filters = { search: "", categoryId: "", publication: "", stock: "", minPrice: "", maxPrice: "", brand: "" }

function queryFromFilters(filters: Filters, page: number): ProductListQuery {
  return {
    page, pageSize: PAGE_SIZE, search: filters.search.trim() || undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    isPublished: filters.publication === "" ? undefined : filters.publication === "published",
    inStock: filters.stock === "" ? undefined : filters.stock === "in-stock",
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    brand: filters.brand.trim() || undefined, sortBy: "name", sortOrder: "asc",
  }
}

export default function ProductsPage() {
  const [data, setData] = useState<ProductsResponse>({ success: true, items: [], totalCount: 0, totalPages: 1 })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [duplicating, setDuplicating] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkPriceValue, setBulkPriceValue] = useState("")
  const [bulkQuantityValue, setBulkQuantityValue] = useState("")
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const staticBaseUrl = process.env.NEXT_PUBLIC_API_URL
  const query = useMemo(() => queryFromFilters(filters, page), [filters, page])
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const loadProducts = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const response = await productsApi.getProducts(query)
      setData(response)
      if (page > response.totalPages && response.totalPages > 0) setPage(response.totalPages)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ürünler yüklenemedi") }
    finally { setLoading(false) }
  }, [page, query])
  useEffect(() => { void loadProducts() }, [loadProducts])
  useEffect(() => { void categoriesApi.getCategories().then(response => setCategories(response.data ?? [])).catch(() => setCategories([])) }, [])

  const updateFilters = (patch: Partial<Filters>) => { setFilters(current => ({ ...current, ...patch })); setPage(1); setSelected([]) }
  const reload = async () => { await loadProducts() }
  const formatPrice = (value: number) => value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
  const pageButtons = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, Math.max(1, data.totalPages - 4)))
    return Array.from({ length: Math.min(5, data.totalPages) }, (_, index) => start + index)
  }, [data.totalPages, page])

  const handleDelete = async (id: number) => {
    try { setDeleting(id); await productsApi.deleteProduct(id); setSelected(current => current.filter(value => value !== id)); await reload() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Ürün silinirken hata oluştu") }
    finally { setDeleting(null) }
  }
  const handleDuplicate = async (id: number) => {
    try { setDuplicating(id); const response = await productsApi.duplicateProduct(id); await reload(); const copyId = response.data?.id; if (copyId) window.location.href = `/products/edit/${copyId}` }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Ürün kopyalanamadı") }
    finally { setDuplicating(null) }
  }
  const updateStock = async (product: ProductsResponse["items"][number]) => {
    const raw = window.prompt(`${product.name} için stok değişimi (+/- adet):`, "0")
    if (raw === null) return
    const quantityChange = Number(raw)
    if (!Number.isInteger(quantityChange) || quantityChange === 0) { setError("Stok değişimi sıfır olmayan tam sayı olmalıdır."); return }
    try { await fetchApi(`admin/AdminProduct/${product.id}/stock`, { method: "PATCH", body: JSON.stringify({ productId: product.id, quantityChange, reason: "Admin hızlı stok güncellemesi" }) }); await reload() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Stok güncellenemedi") }
  }
  const bulkPublish = async (isPublished: boolean) => {
    if (!selected.length) return
    try { await fetchApi("admin/AdminProduct/bulk-publish", { method: "PATCH", body: JSON.stringify({ productIds: selected, isPublished }) }); setSelected([]); await reload() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Toplu yayın durumu güncellenemedi") }
  }
  const bulkPrice = async () => {
    if (!selected.length) return
    const raw = window.prompt("Seçili ürünlerin yeni temel fiyatı (₺):")
    if (raw === null) return
    const basePrice = Number(raw)
    if (!(basePrice > 0)) { setError("Geçerli bir fiyat girin."); return }
    try { await fetchApi("admin/AdminProduct/bulk-update-prices", { method: "PATCH", body: JSON.stringify({ products: selected.map(id => ({ id, basePrice, discountPrice: null })) }) }); setSelected([]); await reload() }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Toplu fiyat güncellenemedi") }
  }
  const updateFilteredProducts = async (event: FormEvent) => {
    event.preventDefault()
    const basePrice = bulkPriceValue.trim() === "" ? undefined : Number(bulkPriceValue)
    const quantity = bulkQuantityValue.trim() === "" ? undefined : Number(bulkQuantityValue)
    if (basePrice === undefined && quantity === undefined) { setError("Fiyat veya stok miktarından en az birini girin."); return }
    if (basePrice !== undefined && !(basePrice > 0)) { setError("Geçerli bir fiyat girin."); return }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) { setError("Stok miktarı sıfır veya pozitif tam sayı olmalıdır."); return }
    setBulkUpdating(true)
    try {
      const { page: ignoredPage, pageSize: ignoredPageSize, sortBy: ignoredSortBy, sortOrder: ignoredSortOrder, ...filter } = queryFromFilters(filters, 1)
      void ignoredPage; void ignoredPageSize; void ignoredSortBy; void ignoredSortOrder
      await fetchApi("admin/AdminProduct/bulk-update-by-filter", { method: "PATCH", body: JSON.stringify({ filter, basePrice, quantity }) })
      setBulkPriceValue(""); setBulkQuantityValue(""); setShowBulkForm(false); setSelected([]); await reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Filtrelenen ürünler güncellenemedi") }
    finally { setBulkUpdating(false) }
  }

  return <div className="mx-auto max-w-7xl space-y-6 pb-10">
    <div className="rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-blue-200"><PackageSearch className="size-4" />Katalog operasyonu</div><h1 className="text-3xl font-bold tracking-tight">Ürünler</h1><p className="mt-2 text-sm text-slate-300">Filtreleyin, sayfalar arasında geçin ve ürünleri toplu yönetin.</p></div><Link href="/products/add"><Button className="bg-white text-slate-900 hover:bg-slate-100"><Plus className="mr-2 h-4 w-4" />Yeni Ürün</Button></Link></div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">Filtrelenen ürün</p><p className="mt-1 text-xl font-semibold">{data.totalCount}</p></div><div><p className="text-xs text-slate-400">Bu sayfada yayında</p><p className="mt-1 text-xl font-semibold">{data.items.filter(item => item.isPublished).length}</p></div></div></div>
    <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="space-y-4 border-b p-5 md:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Ürün envanteri</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Sayfada 25 ürün gösterilir. Seçili veya filtrelenen ürünleri toplu güncelleyebilirsiniz.</p></div><Badge variant="secondary">{data.totalCount} ürün</Badge></div>
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-2 xl:grid-cols-4"><div className="relative md:col-span-2"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Ürün adı veya açıklamasında ara..." className="pl-8" value={filters.search} onChange={event => updateFilters({ search: event.target.value })} /></div><select aria-label="Kategori filtresi" className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.categoryId} onChange={event => updateFilters({ categoryId: event.target.value })}><option value="">Tüm kategoriler</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Yayın durumu filtresi" className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.publication} onChange={event => updateFilters({ publication: event.target.value as Filters["publication"] })}><option value="">Tüm yayın durumları</option><option value="published">Yayında</option><option value="draft">Taslak</option></select><select aria-label="Stok durumu filtresi" className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.stock} onChange={event => updateFilters({ stock: event.target.value as Filters["stock"] })}><option value="">Tüm stok durumları</option><option value="in-stock">Stokta</option><option value="out-of-stock">Tükendi</option></select><Input aria-label="Minimum fiyat" type="number" min="0" placeholder="Minimum fiyat" value={filters.minPrice} onChange={event => updateFilters({ minPrice: event.target.value })} /><Input aria-label="Maksimum fiyat" type="number" min="0" placeholder="Maksimum fiyat" value={filters.maxPrice} onChange={event => updateFilters({ maxPrice: event.target.value })} /><Input aria-label="Marka filtresi" placeholder="Marka" value={filters.brand} onChange={event => updateFilters({ brand: event.target.value })} /><Button type="button" variant="outline" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); setSelected([]) }} disabled={activeFilterCount === 0}><X className="mr-2 h-4 w-4" />Filtreleri temizle</Button></div>
      <Button size="sm" variant="outline" onClick={() => setShowBulkForm(value => !value)} disabled={data.totalCount === 0}><SlidersHorizontal className="mr-2 h-4 w-4" />Filtrelenen {data.totalCount} ürünü güncelle</Button>
      {showBulkForm && <form onSubmit={updateFilteredProducts} className="flex flex-wrap items-end gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4"><div className="min-w-48 flex-1"><label className="mb-1 block text-sm font-medium">Yeni temel fiyat (₺)</label><Input type="number" min="0.01" step="0.01" placeholder="Boş bırakılabilir" value={bulkPriceValue} onChange={event => setBulkPriceValue(event.target.value)} /></div><div className="min-w-48 flex-1"><label className="mb-1 block text-sm font-medium">Yeni stok miktarı</label><Input type="number" min="0" step="1" placeholder="Boş bırakılabilir" value={bulkQuantityValue} onChange={event => setBulkQuantityValue(event.target.value)} /></div><p className="w-full text-xs text-muted-foreground">Bu işlem mevcut filtrelere uyan {data.totalCount} ürüne uygulanır. Girilen fiyat varsa indirimli fiyat kaldırılır.</p><Button type="submit" disabled={bulkUpdating}>{bulkUpdating ? "Güncelleniyor..." : `${data.totalCount} ürünü güncelle`}</Button><Button type="button" variant="ghost" onClick={() => setShowBulkForm(false)} disabled={bulkUpdating}>İptal</Button></form>}
      {selected.length > 0 && <div className="flex flex-wrap gap-2 rounded border p-3 text-sm"><span className="mr-2 self-center">{selected.length} ürün seçildi</span><Button size="sm" onClick={bulkPrice}>Seçili ürünlere fiyat</Button><Button size="sm" variant="outline" onClick={() => bulkPublish(true)}>Yayınla</Button><Button size="sm" variant="outline" onClick={() => bulkPublish(false)}>Pasife al</Button></div>}
    </CardHeader><CardContent>{loading ? <div className="py-10 text-center text-muted-foreground">Yükleniyor...</div> : <div><Table><TableHeader><TableRow><TableHead><input aria-label="Bu sayfadaki tüm ürünleri seç" type="checkbox" checked={data.items.length > 0 && data.items.every(item => selected.includes(item.id))} onChange={event => setSelected(current => event.target.checked ? [...new Set([...current, ...data.items.map(item => item.id)])] : current.filter(id => !data.items.some(item => item.id === id)))} /></TableHead><TableHead>Görsel</TableHead><TableHead>İsim</TableHead><TableHead>SKU</TableHead><TableHead>Kategori</TableHead><TableHead>Marka</TableHead><TableHead>Fiyat</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">Stok</TableHead><TableHead>Tarih</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader><TableBody>{data.items.length === 0 ? <TableRow><TableCell colSpan={11} className="py-8 text-center text-muted-foreground">Bu filtrelerle ürün bulunamadı</TableCell></TableRow> : data.items.map(product => <TableRow key={product.id}><TableCell><input aria-label={`${product.name} seç`} type="checkbox" checked={selected.includes(product.id)} onChange={event => setSelected(current => event.target.checked ? [...current, product.id] : current.filter(id => id !== product.id))} /></TableCell><TableCell><div className="relative h-10 w-10">{staticBaseUrl && <Image src={product.mainImageUrl?.startsWith("http") ? product.mainImageUrl : `${staticBaseUrl}${product.mainImageUrl || "/placeholder.svg"}`} alt={product.name} fill className="rounded-md object-cover" sizes="40px" />}</div></TableCell><TableCell className="font-medium"><div className="font-semibold">{product.name}</div>{product.shortDescription && <div className="max-w-[200px] truncate text-sm text-muted-foreground">{product.shortDescription}</div>}</TableCell><TableCell className="font-mono text-sm">{product.sku}</TableCell><TableCell>{product.categoryName}</TableCell><TableCell>{product.brand || "-"}</TableCell><TableCell><div className="font-semibold">{formatPrice(product.effectivePrice)}</div>{product.discountPrice !== product.basePrice && <div className="text-sm text-muted-foreground line-through">{formatPrice(product.basePrice)}</div>}</TableCell><TableCell><Badge variant="outline" className={product.isPublished ? "border-green-500 text-green-500" : "border-yellow-500 text-yellow-500"}>{product.isPublished ? "Yayında" : "Taslak"}</Badge></TableCell><TableCell className="text-right"><div className="font-semibold">{product.quantity}</div><div className={`text-sm ${product.inStock ? "text-green-600" : "text-red-600"}`}>{product.inStock ? "Stokta" : "Tükendi"}</div></TableCell><TableCell className="text-sm text-muted-foreground">{new Date(product.createdAt).toLocaleDateString("tr-TR")}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => updateStock(product)}>Stok</Button><Button variant="ghost" size="icon" title="Taslak olarak kopyala" disabled={duplicating === product.id} onClick={() => handleDuplicate(product.id)}><Copy className="h-4 w-4" /></Button><Link href={`/products/edit/${product.id}`}> <Button variant="ghost" size="icon" className="text-palette-blue hover:bg-palette-lightBlue/20 hover:text-palette-lightBlue"><Pencil className="h-4 w-4" /></Button></Link><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Ürünü Sil</AlertDialogTitle><AlertDialogDescription><strong>{product.name}</strong> ürününü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-500 hover:bg-red-600">{deleting === product.id ? "Siliniyor..." : "Sil"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></TableCell></TableRow>)}</TableBody></Table>{data.totalPages > 1 && <nav aria-label="Ürün sayfalaması" className="flex flex-wrap items-center justify-center gap-2 py-4"><Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => { setPage(current => current - 1); setSelected([]) }}>Önceki</Button>{pageButtons.map(pageNumber => <Button key={pageNumber} variant={pageNumber === page ? "default" : "outline"} size="sm" aria-current={pageNumber === page ? "page" : undefined} disabled={loading} onClick={() => { setPage(pageNumber); setSelected([]) }}>{pageNumber}</Button>)}<Button variant="outline" size="sm" disabled={page === data.totalPages || loading} onClick={() => { setPage(current => current + 1); setSelected([]) }}>Sonraki</Button></nav>}</div>}</CardContent></Card>
  </div>
}
