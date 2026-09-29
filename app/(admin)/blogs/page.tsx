"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BookOpen, Eye, Search, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { blogPostsApi } from "@/lib/api"
import { BlogPost } from "@/lib/types"

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [query, setQuery] = useState("")
  const pageSize = 10

  useEffect(() => {
    let active = true

    const loadPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await blogPostsApi.search(pageNumber, pageSize)
        
        if (active) {
          setPosts(response.items || [])
          setTotalPages(response.totalPages || 1)
          setTotalCount(response.totalCount || 0)
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Blog yazıları yüklenemedi")
          setPosts([])
          setTotalPages(1)
          setTotalCount(0)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPosts()
    return () => { active = false }
  }, [pageNumber, pageSize])

  const handlePreviousPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1)
  }

  const handleNextPage = () => {
    if (pageNumber < totalPages) setPageNumber(pageNumber + 1)
  }
  const visiblePosts = useMemo(() => posts.filter(post => `${post.title} ${post.slug} ${post.blogCategory?.name ?? ""}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))), [posts, query])

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-palette-blue">Blog Yazıları</h1>
          <Link href="/blogs/add">
            <Button className="bg-black hover:bg-palette-white hover:text-black">
              <Plus className="mr-2 h-4 w-4" /> Yeni Yazı
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-fuchsia-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-fuchsia-200"><BookOpen className="size-4" />İçerik merkezi</div><h1 className="text-3xl font-bold tracking-tight">Blog yazıları</h1><p className="mt-2 text-sm text-slate-300">İçerikleri, kategori bağlantılarını ve performanslarını tek listede yönetin.</p></div>
        <Link href="/blogs/add">
          <Button className="bg-white text-slate-900 hover:bg-slate-100">
            <Plus className="mr-2 h-4 w-4" /> Yeni Yazı
          </Button>
        </Link>
      </div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">Toplam yazı</p><p className="mt-1 text-xl font-semibold">{totalCount}</p></div><div><p className="text-xs text-slate-400">Bu sayfadaki görüntülenme</p><p className="mt-1 text-xl font-semibold">{posts.reduce((sum,item)=>sum+item.views,0)}</p></div></div></div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="space-y-4 border-b p-5 md:px-7"><div className="flex items-center justify-between"><div><CardTitle>İçerik envanteri</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Bu sayfada {visiblePosts.length} sonuç gösteriliyor.</p></div><Badge variant="secondary">{totalCount} yazı</Badge></div>
          <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Başlık, slug veya kategori ara" value={query} onChange={event=>setQuery(event.target.value)} /></div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Yükleniyor...</div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-3 size-8 text-slate-300" />Henüz yazı eklenmemiş</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Yayın Tarihi</TableHead>
                    <TableHead>Görüntülenme</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePosts.map((post) => (
                    <TableRow key={post.id} className="transition-colors hover:bg-slate-50/80">
                      <TableCell className="text-slate-400">#{post.id}</TableCell>
                      <TableCell className="font-medium"><p>{post.title}</p><p className="mt-1 font-mono text-xs font-normal text-slate-400">/{post.slug}</p></TableCell>
                      <TableCell>{post.blogCategory?.name ? <Badge variant="secondary">{post.blogCategory.name}</Badge> : "-"}</TableCell>
                      <TableCell>{new Date(post.publishDate).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1"><Eye className="size-3.5 text-slate-400" />{post.views}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/blogs/edit/${post.id}`}>
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
                                <AlertDialogTitle>Yazıyı Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{post.title}</strong> yazısını silmek istediğinize emin misiniz?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 hover:bg-red-600">Sil</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Sayfalama */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Toplam {totalCount} yazıdan {((pageNumber - 1) * pageSize) + 1}-{Math.min(pageNumber * pageSize, totalCount)} arası gösteriliyor
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pageNumber <= 1 || loading} onClick={handlePreviousPage}>Önceki</Button>
                    <span className="px-3 py-1 text-sm">{pageNumber} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={pageNumber >= totalPages || loading} onClick={handleNextPage}>Sonraki</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
