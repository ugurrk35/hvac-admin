"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import type { ProductAttribute } from "@/lib/types"
import { productAttributeApi } from "@/lib/api"
import React from "react"

export default function VariantTypesPage() {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [filteredAttributes, setFilteredAttributes] = useState<ProductAttribute[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<number[]>([])

  const fetchAttributes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await productAttributeApi.getProductAttributes()
      setAttributes(response.data ?? [])
      setFilteredAttributes(response.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Varyant tipleri yüklenirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAttributes()
  }, [fetchAttributes])

  useEffect(() => {
    const filtered = attributes.filter(
      (attr) =>
        attr.name.toLowerCase().includes(search.toLowerCase()) ||
        attr.productAttributeValues?.some((v) => v.value.toLowerCase().includes(search.toLowerCase()))
    )
    setFilteredAttributes(filtered)
  }, [search, attributes])

  const handleDelete = async (id: number) => {
    try {
      await productAttributeApi.deleteProductAttribute(id)
      setAttributes((prev) => prev.filter((attr) => attr.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Varyant tipi silinirken bir hata oluştu")
    }
  }

  const toggleRowExpand = (id: number) =>
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    )

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Başlık ve Butonlar */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm text-sky-200"><SlidersHorizontal className="size-4" />Ürün kataloğu</div><h1 className="text-3xl font-bold tracking-tight">Varyant tipleri</h1><p className="mt-2 text-sm text-slate-300">Beden, renk ve kişiselleştirme seçeneklerinin ürün kartındaki davranışını yönetin.</p></div>
        <div className="flex gap-2">
          <Button
            onClick={fetchAttributes}
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Link href="/variant-types/add">
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Varyant Tipi
            </Button>
          </Link>
        </div>
      </div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">Varyant tipi</p><p className="mt-1 text-xl font-semibold">{attributes.length}</p></div><div><p className="text-xs text-slate-400">Toplam seçenek</p><p className="mt-1 text-xl font-semibold">{attributes.reduce((sum,item)=>sum+(item.productAttributeValues?.length??0),0)}</p></div></div></div>

      {/* Hata Mesajı */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <br />
            <Button
              onClick={fetchAttributes}
              className="mt-2 bg-palette-blue hover:bg-palette-lightBlue"
              size="sm"
            >
              Tekrar Dene
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tablo */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="space-y-4 border-b p-5 md:px-7">
          <div className="flex items-center justify-between"><div><CardTitle>Varyant envanteri</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Satıra tıklayarak seçenekleri ve kişiselleştirme kurallarını görün.</p></div><Badge variant="secondary">{filteredAttributes.length} sonuç</Badge></div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Varyant tiplerinde ara..."
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
                <TableHead className="w-10"></TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Kişiselleştirme</TableHead>
                <TableHead>Değer Sayısı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredAttributes.map((attribute) => (
                    <React.Fragment key={attribute.id}>
                      <TableRow className="cursor-pointer hover:bg-gray-50">
                        <TableCell onClick={() => toggleRowExpand(attribute.id!)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            {expandedRows.includes(attribute.id!) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium" onClick={() => toggleRowExpand(attribute.id!)}>
                          {attribute.name}
                        </TableCell>
                        <TableCell onClick={() => toggleRowExpand(attribute.id!)}>
                          <Badge
                            variant="outline"
                            className={
                              attribute.isPersonalizationText
                                ? "border-blue-500 text-blue-500"
                                : "border-gray-500 text-gray-500"
                            }
                          >
                            {attribute.isPersonalizationText ? "Metin" : "Seçenek"}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={() => toggleRowExpand(attribute.id!)}>
                          {attribute.productAttributeValues?.length ?? 0}
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Link href={`/variant-types/edit/${attribute.id}`}>
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
                                <AlertDialogTitle>Varyant Tipini Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu varyant tipini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDelete(attribute.id!)}
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row */}
                      {expandedRows.includes(attribute.id!) && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-gray-50 p-4">
                              {attribute.isPersonalizationText ? (
                                <div className="space-y-2">
                                  <h4 className="font-medium">Kişiselleştirme Bilgileri</h4>
                                  <p><strong>Metin İsteği:</strong> {attribute.textPrompt}</p>
                                  <p><strong>Maksimum Uzunluk:</strong> {attribute.maxLength} karakter</p>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-medium mb-2">Değerler</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {attribute.productAttributeValues?.map((value) => (
                                      <Badge key={value.id} variant="secondary" className="px-3 py-1">
                                        {value.value}
                                        {value.priceModifier > 0 && ` (+${value.priceModifier}₺)`}
                                        {value.priceModifier < 0 && ` (${value.priceModifier}₺)`}
                                      </Badge>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
            </TableBody>
          </Table>

          {!loading && filteredAttributes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {search
                ? "Arama kriterlerine uygun varyant tipi bulunamadı."
                : "Henüz varyant tipi eklenmemiş."}
              {!search && (
                <div className="mt-4">
                  <Link href="/variant-types/add">
                    <Button className="bg-palette-blue hover:bg-palette-lightBlue">
                      <Plus className="mr-2 h-4 w-4" />
                      İlk Varyant Tipini Ekle
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
