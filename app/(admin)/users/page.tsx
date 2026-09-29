"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Search, RefreshCw, Pencil, Trash2, UsersRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { adminUsersApi } from "@/lib/api"
import type { AdminUserListItem } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [search, setSearch] = useState("")
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  // hata mesajını şimdilik loglayalım ki linter uyarısı olmasın
  const [error, setError] = useState<string | null>(null)

  // Filters & sorting
  const [roleFilter, setRoleFilter] = useState("")
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "true" | "false">("all")
  const [emailConfirmedFilter, setEmailConfirmedFilter] = useState<"all" | "true" | "false">("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query: {
        pageNumber: number
        pageSize: number
        searchTerm?: string
        role?: string
        isActive?: boolean
        emailConfirmed?: boolean
        sortBy: string
        sortOrder: "asc" | "desc"
      } = {
        pageNumber,
        pageSize,
        searchTerm: search.trim() || undefined,
        sortBy,
        sortOrder,
      }
      if (roleFilter.trim()) query.role = roleFilter.trim()
      if (isActiveFilter !== "all") query.isActive = isActiveFilter === "true"
      if (emailConfirmedFilter !== "all") query.emailConfirmed = emailConfirmedFilter === "true"

      const res = await adminUsersApi.getUsers(query)
      if (res.success) {
        setUsers(res.items)
        setTotalPages(res.totalPages)
        setTotalCount(res.totalCount)
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kullanıcılar yüklenemedi")
      setUsers([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [pageNumber, pageSize, search, roleFilter, isActiveFilter, emailConfirmedFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (id: number) => {
    try {
      await adminUsersApi.deleteUser(id)
      fetchUsers()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi")
    }
  }

  const roleBadge = (role: string) => (
    <Badge key={role} variant="outline" className="mr-1">
      {role}
    </Badge>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-indigo-200"><UsersRound className="size-4" />Kimlik ve erişim</div><h1 className="text-3xl font-bold tracking-tight">Kullanıcılar</h1><p className="mt-2 text-sm text-slate-300">Müşteri ve ekip hesaplarını, durumlarını ve atanmış rollerini yönetin.</p></div>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} disabled={loading} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Yenile
          </Button>
          <Link href="/roles">
            <Button variant="outline">Roller</Button>
          </Link>
        </div>
      </div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">Toplam kullanıcı</p><p className="mt-1 text-xl font-semibold">{totalCount}</p></div><div><p className="text-xs text-slate-400">Bu sayfada aktif</p><p className="mt-1 text-xl font-semibold">{users.filter(user=>user.isActive).length}</p></div></div></div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="space-y-4 border-b p-5 md:px-7">
          <div className="flex items-center justify-between"><div><CardTitle>Kullanıcı envanteri</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Filtre, rol ve hesap durumuna göre sonuçları daraltın.</p></div><Badge variant="secondary">{totalCount} kayıt</Badge></div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="E-posta, ad, soyad..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPageNumber(1)
                }}
                className="pl-8 border-palette-lightBlue"
              />
            </div>
            <Input
              placeholder="Rol (örn: Admin)"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPageNumber(1)
              }}
              className="w-40 border-palette-lightBlue"
            />
            <Select
              value={isActiveFilter}
              onValueChange={(v: "all" | "true" | "false") => {
                setIsActiveFilter(v)
                setPageNumber(1)
              }}
            >
              <SelectTrigger className="w-32 border-palette-lightBlue"><SelectValue placeholder="Durum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Durum: Tümü</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Pasif</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={emailConfirmedFilter}
              onValueChange={(v: "all" | "true" | "false") => {
                setEmailConfirmedFilter(v)
                setPageNumber(1)
              }}
            >
              <SelectTrigger className="w-40 border-palette-lightBlue"><SelectValue placeholder="E-posta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">E-posta: Tümü</SelectItem>
                <SelectItem value="true">Onaylı</SelectItem>
                <SelectItem value="false">Onaysız</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v: string) => {
                setSortBy(v)
                setPageNumber(1)
              }}
            >
              <SelectTrigger className="w-44 border-palette-lightBlue"><SelectValue placeholder="Sırala" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Tarih</SelectItem>
                <SelectItem value="email">E-posta</SelectItem>
                <SelectItem value="firstname">Ad</SelectItem>
                <SelectItem value="lastname">Soyad</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(v: "asc" | "desc") => {
                setSortOrder(v)
                setPageNumber(1)
              }}
            >
              <SelectTrigger className="w-28 border-palette-lightBlue"><SelectValue placeholder="Yön" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Artan</SelectItem>
                <SelectItem value="desc">Azalan</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(v: string) => {
                setPageSize(Number(v))
                setPageNumber(1)
              }}
            >
              <SelectTrigger className="w-28 border-palette-lightBlue"><SelectValue placeholder="Sayfa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setRoleFilter("")
                setIsActiveFilter("all")
                setEmailConfirmedFilter("all")
                setSortBy("createdAt")
                setSortOrder("desc")
                setPageSize(20)
                setPageNumber(1)
              }}
            >
              Sıfırla
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Roller</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <div className="h-4 bg-gray-100 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? "Arama kriterlerine uygun kullanıcı bulunamadı" : "Henüz kullanıcı yok"}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {u.firstName} {u.lastName}
                    </TableCell>
                    <TableCell>
                      {u.roles && u.roles.length > 0 ? u.roles.map(roleBadge) : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Aktif" : "Pasif"}</Badge>
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/users/edit/${u.id}`}>
                          <Button variant="ghost" size="icon" className="text-palette-blue hover:bg-palette-lightBlue/20">
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
                              <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{u.email}</strong> kullanıcısını silmek istediğinizden emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(u.id)}>
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber === 1 || loading}
                className="border-palette-lightBlue hover:bg-palette-lightBlue/20"
              >
                Önceki
              </Button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                const page = pageNumber <= 3 ? i + 1 : pageNumber - 2 + i
                if (page > totalPages) return null
                return (
                  <Button
                    key={page}
                    variant={pageNumber === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPageNumber(page)}
                    disabled={loading}
                    className={
                      pageNumber === page
                        ? "bg-palette-blue hover:bg-palette-lightBlue"
                        : "border-palette-lightBlue hover:bg-palette-lightBlue/20"
                    }
                  >
                    {page}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                disabled={pageNumber === totalPages || loading}
                className="border-palette-lightBlue hover:bg-palette-lightBlue/20"
              >
                Sonraki
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
