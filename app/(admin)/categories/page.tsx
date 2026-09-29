"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Search, RefreshCw, FolderTree } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
// import type { Category } from "@/lib/types"
import { categoriesApi } from "@/lib/api"
import { Category } from "@/lib/types"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await categoriesApi.getCategories()
      setCategories(response.data)
      setFilteredCategories(response.data)
     
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kategoriler yüklenirken bir hata oluştu")
    
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    // Filter categories based on search
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description.toLowerCase().includes(search.toLowerCase()) ||
        category.slug.toLowerCase().includes(search.toLowerCase()),
    )
    setFilteredCategories(filtered)
  }, [search, categories])

  const handleDelete = async (id: number) => {
    try {
      await categoriesApi.deleteCategory(id)
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kategori silinirken bir hata oluştu")
    }
  }

  // Manuel test için API çağrısı


  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-emerald-200"><FolderTree className="size-4" />Ürün kataloğu</div><h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1><p className="mt-2 text-sm text-slate-300">Ürünleri müşterilerin kolayca keşfedebileceği kategori yapısında düzenleyin.</p></div>
        <div className="flex gap-2">
         
          <Button
            onClick={fetchCategories}
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Link href="/categories/add">
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kategori
            </Button>
          </Link>
        </div>
      </div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">Kategori</p><p className="mt-1 text-xl font-semibold">{categories.length}</p></div><div><p className="text-xs text-slate-400">Kategorilenen ürün</p><p className="mt-1 text-xl font-semibold">{categories.reduce((sum,item)=>sum+(item.products?.length??0),0)}</p></div></div></div>

     

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <br />
            <Button onClick={fetchCategories} className="mt-2 bg-palette-blue hover:bg-palette-lightBlue" size="sm">
              Tekrar Dene
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="space-y-4 border-b p-5 md:px-7">
          <div className="flex items-center justify-between"><div><CardTitle>Kategori envanteri</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Kategori adı, slug veya açıklama ile arayın.</p></div><Badge variant="secondary">{filteredCategories.length} sonuç</Badge></div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kategorilerde ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 border-palette-lightBlue"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Ürünler</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-[50px] ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell className="text-right">{category.products?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/categories/edit/${category.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-palette-blue hover:text-palette-lightBlue hover:bg-palette-lightBlue/20"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(category.id)}
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

          {!loading && filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {search ? "Arama kriterlerine uygun kategori bulunamadı." : "Henüz kategori eklenmemiş."}
              {!search && (
                <div className="mt-4">
                  <Link href="/categories/add">
                    <Button className="bg-palette-blue hover:bg-palette-lightBlue">
                      <Plus className="mr-2 h-4 w-4" />
                      İlk Kategoriyi Ekle
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
