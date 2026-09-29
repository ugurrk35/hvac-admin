"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Pencil, Trash2, Plus, Tags, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { blogCategoriesApi } from "@/lib/api"
import { BlogCategoryList } from "@/lib/types"




export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategoryList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")

 useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await blogCategoriesApi.getAll()
        if (active) setCategories(data)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Kategoriler yüklenemedi")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const visibleCategories = useMemo(() => categories.filter(category => `${category.name} ${category.description ?? ""}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))), [categories, query])
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>
  }
const handleDelete = async (id: number) => {
  if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return
  try {
    await blogCategoriesApi.deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setMessage("Kategori silindi.")
  } catch (error) {
    alert(error instanceof Error ? error.message : "Silme sırasında bir hata oluştu")
  }
}
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-violet-200"><Tags className="size-4" />İçerik mimarisi</div><h1 className="text-3xl font-bold tracking-tight">Blog kategorileri</h1><p className="mt-2 text-sm text-slate-300">İçeriklerinizi düzenli, bulunabilir ve SEO uyumlu konu başlıklarında toplayın.</p></div>
        <Link href="/blogs/categories/add">
          <Button className="bg-white text-slate-900 hover:bg-slate-100">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori
          </Button>
        </Link>
      </div><div className="mt-7 border-t border-white/10 pt-5"><p className="text-xs text-slate-400">Toplam kategori</p><p className="mt-1 text-xl font-semibold">{categories.length}</p></div></div>
      {message&&<div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900"><CheckCircle2 className="size-4" />{message}</div>}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="space-y-4 border-b p-5 md:px-7">
          <div className="flex items-center justify-between"><div><CardTitle>Kategori envanteri</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">{visibleCategories.length} kategori gösteriliyor.</p></div><Badge variant="secondary">{categories.length} kategori</Badge></div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kategorilerde ara..."
              className="pl-8 border-palette-lightBlue"
              value={query}
              onChange={event=>setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Yükleniyor...</div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Henüz kategori eklenmemiş</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCategories.map((cat) => (
                  <TableRow key={cat.id} className="transition-colors hover:bg-slate-50/80">
                    <TableCell className="text-slate-400">#{cat.id}</TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="max-w-md truncate text-slate-600">{cat.description || "-"}</TableCell>
                    <TableCell>{new Date(cat.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/blogs/categories/edit/${cat.id}`}>
                          <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{cat.name}</strong> kategorisini silmek istediğinize emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                             <AlertDialogAction
  className="bg-red-500 hover:bg-red-600"
  onClick={() => handleDelete(cat.id)}
>
  Sil
</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
