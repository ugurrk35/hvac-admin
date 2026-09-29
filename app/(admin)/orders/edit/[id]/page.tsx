"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Archive,
  CreditCard, 
  Truck, 
  Package, 
  Edit3, 
  Save,
  X,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  History
} from "lucide-react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GenericPageLayout } from "@/components/generic/GenericPageLayout"
import { fetchApi, ordersApi } from "@/lib/api"
import type { OrderEdit, OrderNote, OrderTimelineItem } from "@/lib/types"

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL
if (!configuredApiUrl) throw new Error("NEXT_PUBLIC_API_URL tanımlı değil.")
const API_BASE_URL = configuredApiUrl.replace(/\/$/, "")
const toProductImageUrl = (value: string) =>
  /^https?:\/\//i.test(value)
    ? value
    : `${API_BASE_URL}/${value.replace(/^\/+/, "")}`

type OrderStatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "warning"
  | "success"
  | "info"

type OrderStatusInfo = {
  text: string
  variant: OrderStatusBadgeVariant
  icon: React.ElementType
}

const orderStatusMap: Record<number, OrderStatusInfo> = {
  0: { text: "Beklemede", variant: "warning", icon: Clock },
  1: { text: "İşleniyor", variant: "info", icon: AlertCircle },
  2: { text: "Kargolandı", variant: "secondary", icon: Truck },
  3: { text: "Teslim Edildi", variant: "success", icon: CheckCircle },
  4: { text: "İptal Edildi", variant: "destructive", icon: XCircle },
  5: { text: "Tamamlandı", variant: "success", icon: CheckCircle },
  6: { text: "İade Edildi", variant: "secondary", icon: Archive },
}

const allowedNextStatusIds: Record<number, number[]> = {
  0: [1, 4],
  1: [2, 4],
  2: [3],
  3: [5, 6],
  4: [],
  5: [],
  6: [],
}




export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id

  const [order, setOrder] = useState<OrderEdit | null>(null)
  const [timeline, setTimeline] = useState<OrderTimelineItem[]>([])
  const [notes, setNotes] = useState<OrderNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [refunding, setRefunding] = useState(false)
  const [refundConfirmationOpen, setRefundConfirmationOpen] = useState(false)
  const [refundIdempotencyKey, setRefundIdempotencyKey] = useState("")
  const [archiveReason, setArchiveReason] = useState("")
  const [archiving, setArchiving] = useState(false)
  const [resendingPaymentEmail, setResendingPaymentEmail] = useState(false)

  useEffect(() => {
  if (!orderId) return

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await ordersApi.getOrderById(Number(orderId))
      if (!response.data) throw new Error("Sipariş bulunamadı")
      setOrder(response.data)

      const [timelineResult, notesResult] = await Promise.allSettled([
        ordersApi.getTimeline(Number(orderId)),
        ordersApi.getNotes(Number(orderId)),
      ])
      setTimeline(timelineResult.status === "fulfilled" ? timelineResult.value.data || [] : [])
      setNotes(notesResult.status === "fulfilled" ? notesResult.value.data || [] : [])

    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata")
    } finally {
      setLoading(false)
    }
  }

  fetchOrder()
}, [orderId])

  const handleStatusChange = (statusValue: string) => {
    if (!order) return
    const newStatusId = Number(statusValue);
    const newTrackingNumber = newStatusId === 2 ? order.cargoTracking : "";
    setOrder({ ...order, orderStatusId: newStatusId, cargoTracking: newTrackingNumber });
  }

  const handleTrackingInputChange = (value: string) => {
    if (!order) return;
    setOrder({ ...order, cargoTracking: value });
  };

  const handleRefund = async () => {
    if (!order || !refundAmount || !refundReason.trim()) return
    setRefunding(true); setError(null)
    try { await fetchApi(`/admin/AdminOrder/${order.id}/refund`, { method: "POST", body: JSON.stringify({ amount: Number(refundAmount), reason: refundReason.trim(), confirmed: true, idempotencyKey: refundIdempotencyKey }) }); setRefundConfirmationOpen(false); setRefundAmount(""); setRefundReason(""); setRefundIdempotencyKey(""); window.location.reload() }
    catch (err) { setError(err instanceof Error ? err.message : "İade işlemi gerçekleştirilemedi.") }
    finally { setRefunding(false) }
  }

  const handleArchive = async () => {
    if (!order || !archiveReason.trim()) return
    setArchiving(true); setError(null)
    try {
      await ordersApi.archiveOrders([order.id], archiveReason.trim())
      router.push("/orders")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sipariş arşivlenemedi.")
    } finally {
      setArchiving(false)
    }
  }

  const handleAddNote = async () => {
    if (!order || !newNote.trim()) return
    setSavingNote(true); setError(null)
    try {
      const response = await ordersApi.addNote(order.id, newNote.trim())
      const savedNote = response.data
      if (savedNote) setNotes(current => [savedNote, ...current])
      setNewNote("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sipariş notu kaydedilemedi.")
    } finally { setSavingNote(false) }
  }

  const handleResendPaymentEmail = async () => {
    if (!order) return
    setResendingPaymentEmail(true); setError(null)
    try {
      const response = await fetchApi<{ success?: boolean; message?: string }>(`/admin/AdminOrder/${order.id}/resend-payment-email`, { method: "POST" })
      alert(response.message || "Ödeme e-postası yeniden gönderildi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ödeme e-postası yeniden gönderilemedi.")
    } finally { setResendingPaymentEmail(false) }
  }

  const handleSave = async () => {
    if (!order) return
    setSaving(true)
    setError(null)

    try {
      const statusUpdateDto = {
        orderId: order.id,
        newStatus: order.orderStatusId,
        cargoTracking: order.orderStatusId === 2 ? order.cargoTracking || "" : "",
      }

      await fetchApi(`/admin/AdminOrder/update-status`, {
        method: "PUT",
        body: JSON.stringify(statusUpdateDto),
      })

      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-600">Sipariş yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hata Oluştu</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sipariş Bulunamadı</h3>
            <p className="text-gray-600">Aradığınız sipariş mevcut değil.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStatus: OrderStatusInfo = orderStatusMap[order.orderStatusId] || { text: "Bilinmiyor", variant: "secondary", icon: AlertCircle };
  const StatusIcon = currentStatus.icon;
  const paymentStatusLabel: Record<number, string> = { 0: "Ödenmedi", 1: "Başarılı", 2: "Başarısız", 3: "İade edildi", 4: "İptal edildi", 5: "Ödendi" }
  const formatTimelineDate = (value: string) => new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })

  return (
    <GenericPageLayout
      title="Sipariş Detayı"
      description={`Sipariş No: ${order.orderNumber}`}
      noCardWrapper
      headerActions={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <Badge variant="secondary" className="px-3 py-1">ID: {order.id}</Badge>
          <Badge variant={currentStatus.variant} className="px-3 py-1 gap-2">
            <StatusIcon className="h-4 w-4" />
            {currentStatus.text}
          </Badge>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm" className=""> 
              <Edit3 className="h-4 w-4 mr-2" /> Durum güncelle
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" /> İptal
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Order Items */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </span>
                  Sipariş Ürünleri ({order.ordersItems?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {order.ordersItems?.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                        
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.productImageUrl ? (
                            <div className="relative group">
                              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden border">
                                <Image
                                  src={toProductImageUrl(item.productImageUrl)}
                                  alt={item.productName}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-300"></div>
                            </div>
                          ) : (
                            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl bg-gray-100 flex items-center justify-center border">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details with Modern Layout */}
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            
                            {/* Product Name */}
                            <div className="md:col-span-2 xl:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Ürün Adı
                              </label>
                              <p className="text-lg font-semibold text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                                {item.productName}
                              </p>
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Adet
                              </label>
                              <p className="text-lg font-semibold text-gray-900 py-2 px-3 bg-blue-50 rounded-md text-center">
                                {item.quantity}
                              </p>
                            </div>

                            {/* Unit Price */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Birim Fiyat
                              </label>
                              <p className="text-lg font-semibold text-gray-900 py-2 px-3 bg-green-50 rounded-md text-center">
                                ₺{item.unitPrice.toFixed(2)}
                              </p>
                            </div>

                            {/* Total Price */}
                            <div className="md:col-span-1">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Toplam
                              </label>
                              <div className="bg-gray-50 py-2 px-3 rounded-md text-center">
                                <p className="text-lg font-bold text-gray-900">₺{(item.quantity * item.unitPrice).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>

                          {item.variantSnapshot ? (
                            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                              <p className="text-sm font-semibold text-amber-900">Ürün seçenekleri ve kişiselleştirme</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950">{item.variantSnapshot}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b"><CardTitle className="flex items-center gap-3 text-lg font-semibold"><span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50"><CreditCard className="h-5 w-5 text-violet-600" /></span>Ödeme ve İade Özeti</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-6"><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Ödeme yöntemi</span><span className="font-medium text-right">{order.paymentMethodName || "-"}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Ödeme durumu</span><Badge variant="outline">{order.paymentStatusId === undefined || order.paymentStatusId === null ? "Bilinmiyor" : paymentStatusLabel[order.paymentStatusId] || "Bilinmiyor"}</Badge></div>{order.paymentReference && <div className="flex justify-between gap-3 text-sm"><span className="text-muted-foreground">Ödeme referansı</span><span className="max-w-[180px] break-all text-right font-mono text-xs">{order.paymentReference}</span></div>}{order.paymentStatusId === 5 && <Button size="sm" variant="outline" onClick={handleResendPaymentEmail} disabled={resendingPaymentEmail}><Mail className="mr-2 h-4 w-4" />{resendingPaymentEmail ? "Gönderiliyor…" : "Ödeme e-postasını yeniden gönder"}</Button>}<div className="border-t pt-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">İade edilen</span><span className="font-medium">₺{(order.refundedAmount || 0).toFixed(2)}</span></div><div className="mt-2 flex justify-between"><span className="text-muted-foreground">İade edilebilir</span><span className="font-semibold">₺{(order.refundableAmount ?? order.totalAmount).toFixed(2)}</span></div></div></CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b"><CardTitle className="flex items-center gap-3 text-lg font-semibold"><span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100"><History className="h-5 w-5 text-slate-700" /></span>İşlem Geçmişi</CardTitle></CardHeader>
              <CardContent className="p-6"><div className="space-y-5">{timeline.length === 0 ? <p className="text-sm text-muted-foreground">Bu sipariş için henüz kayıtlı işlem yok.</p> : timeline.map((item, index) => <div key={`${item.type}-${item.occurredAt}-${index}`} className="relative border-l border-slate-200 pl-4 last:pb-0"><span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${item.type === "refund" ? "bg-amber-500" : item.type === "archive" ? "bg-slate-500" : "bg-blue-500"}`} /><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.description}</p>{item.actor && <p className="mt-1 text-xs text-muted-foreground">İşlemi yapan: {item.actor}</p>}</div><time className="shrink-0 text-xs text-muted-foreground">{formatTimelineDate(item.occurredAt)}</time></div></div>)}</div></CardContent>
            </Card>

            <Card className="border-indigo-200 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-indigo-50/50"><CardTitle className="text-lg font-semibold text-indigo-950">Müşterinin sipariş notu</CardTitle></CardHeader>
              <CardContent className="p-6">
                {order.notes?.trim() ? (
                  <p className="whitespace-pre-wrap rounded-lg bg-indigo-50 p-4 text-sm text-indigo-950">{order.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Müşteri bu sipariş için not bırakmamış.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b"><CardTitle className="text-lg font-semibold">Ekip içi notlar</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-6"><p className="text-sm text-muted-foreground">Bu notlar müşteriye gösterilmez; sipariş operasyonu için saklanır.</p><Textarea maxLength={2000} value={newNote} onChange={event => setNewNote(event.target.value)} placeholder="Müşteri arandı, kargo notu, özel işlem…" disabled={savingNote} /><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{newNote.length}/2000</span><Button size="sm" onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>{savingNote ? "Kaydediliyor..." : "Not ekle"}</Button></div><div className="space-y-3 border-t pt-4">{notes.length === 0 ? <p className="text-sm text-muted-foreground">Henüz ekip içi not yok.</p> : notes.map(note => <div key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm"><p className="whitespace-pre-wrap text-slate-800">{note.content}</p><p className="mt-2 text-xs text-muted-foreground">{note.createdBy || "Sistem"} · {formatTimelineDate(note.createdAt)}</p></div>)}</div></CardContent>
            </Card>

            {(order.orderStatusId === 4 || order.orderStatusId === 6) && (
              <Card className="border-amber-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-amber-50/60"><CardTitle className="flex items-center gap-3 text-lg font-semibold text-amber-950"><span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><Archive className="h-5 w-5 text-amber-700" /></span>Arşivle</CardTitle></CardHeader>
                <CardContent className="space-y-3 p-6"><p className="text-sm text-muted-foreground">Bu işlem siparişi kalıcı olarak silmez. İptal/iade kaydı, finansal veriler ve durum geçmişi korunur.</p><Input placeholder="Arşivleme nedeni" value={archiveReason} onChange={event => setArchiveReason(event.target.value)} disabled={archiving} /><Button variant="outline" onClick={handleArchive} disabled={archiving || !archiveReason.trim()}>{archiving ? "Arşivleniyor..." : "Siparişi arşivle"}</Button></CardContent>
              </Card>
            )}

            {/* Addresses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Shipping Address */}
              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <Truck className="h-5 w-5 text-green-600" />
                    </span>
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{order.shippingAddress.addressLine}</p>
                        <p className="text-gray-600">{order.shippingAddress.district}, {order.shippingAddress.city}</p>
                        <p className="text-gray-600">{order.shippingAddress.country}</p>
                        <Badge variant="outline" className="mt-2">
                          {order.shippingAddress.postalCode}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </span>
                    Fatura Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{order.billingAddress.addressLine}</p>
                        <p className="text-gray-600">{order.billingAddress.district}, {order.billingAddress.city}</p>
                        <p className="text-gray-600">{order.billingAddress.country}</p>
                        <Badge variant="outline" className="mt-2">
                          {order.billingAddress.postalCode}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Order Summary */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </span>
                  Sipariş Özeti
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Sipariş Durumu:</span>
                    {isEditing ? (
                      <Select
                        value={String(order.orderStatusId)}
                        onValueChange={handleStatusChange}
                        disabled={saving}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Durum Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {[order.orderStatusId, ...(allowedNextStatusIds[order.orderStatusId] || [])].map((id) => (
                            <SelectItem key={id} value={String(id)} className="rounded-lg">
                              {orderStatusMap[id]?.text || "Bilinmiyor"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={currentStatus.variant} className="px-3 py-1 gap-2">
                        <StatusIcon className="h-4 w-4" /> {currentStatus.text}
                      </Badge>
                    )}
                  </div>

                  {order.orderStatusId === 2 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Kargo Takip No:</span>
                      {isEditing ? (
                        <Input
                          value={order.cargoTracking || ""}
                          onChange={(e) => handleTrackingInputChange(e.target.value)}
                          placeholder="Takip numarasını girin"
                          className="w-[200px]"
                          disabled={saving}
                        />
                      ) : (
                        order.cargoTracking ? (
                          <Badge className="px-3 py-1">{order.cargoTracking}</Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )
                      )}
                    </div>
                  )}
           
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sipariş No:</span>
                    <span className="font-medium">#{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ürün Sayısı:</span>
                    <span className="font-medium">{order.ordersItems?.length || 0}</span>
                  </div>
               
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Toplam Adet:</span>
                    <span className="font-medium">
                      {order.ordersItems?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </span>
                  </div>
                  <hr className="border-gray-200" />
                  {(order.campaignDiscountTotal ?? 0) > 0 && <div className="flex justify-between items-center text-emerald-700"><span>Kampanya indirimi:</span><span>-₺{order.campaignDiscountTotal?.toFixed(2)}</span></div>}
                  <div className="flex justify-between items-center"><span className="text-gray-600">Kargo:</span><span>₺{(order.shippingAmount ?? 0).toFixed(2)}</span></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Toplam Tutar:</span>
                    <span className="text-gray-900">₺{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b"><CardTitle className="flex items-center gap-3 text-lg font-semibold"><span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><DollarSign className="h-5 w-5 text-amber-600" /></span>İade / Refund</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-6"><p className="text-sm text-muted-foreground">Yalnızca PayTR tarafından onaylanmış ödemeler iade edilir. Kısmi iade mümkündür.</p><Input type="number" min="0.01" max={order.refundableAmount ?? order.totalAmount} step="0.01" placeholder="İade tutarı (₺)" value={refundAmount} onChange={event => setRefundAmount(event.target.value)} disabled={refunding || (order.refundableAmount ?? order.totalAmount) <= 0} /><Input maxLength={1000} placeholder="İade nedeni" value={refundReason} onChange={event => setRefundReason(event.target.value)} disabled={refunding || (order.refundableAmount ?? order.totalAmount) <= 0} /><Button variant="outline" onClick={() => { if (!refundIdempotencyKey) setRefundIdempotencyKey(crypto.randomUUID()); setRefundConfirmationOpen(true) }} disabled={refunding || (order.refundableAmount ?? order.totalAmount) <= 0 || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > (order.refundableAmount ?? order.totalAmount) || !refundReason.trim()}>İadeyi gözden geçir</Button><AlertDialog open={refundConfirmationOpen} onOpenChange={setRefundConfirmationOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>İadeyi onayla</AlertDialogTitle><AlertDialogDescription>₺{Number(refundAmount || 0).toFixed(2)} tutarı PayTR üzerinden iade edilecek. Bu finansal işlem sağlayıcıya gönderildiğinde geri alınamaz.</AlertDialogDescription></AlertDialogHeader><div className="rounded-md bg-muted p-3 text-sm"><div><strong>Neden:</strong> {refundReason}</div><div className="mt-1"><strong>Sipariş:</strong> #{order.orderNumber}</div></div><AlertDialogFooter><AlertDialogCancel disabled={refunding}>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={handleRefund} disabled={refunding}>{refunding ? "İşleniyor..." : "İadeyi onayla"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <User className="h-5 w-5 text-blue-600" />
                  </span>
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {order.userId ? (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Kullanıcı ID:</span>
                    <span className="font-medium">{order.userId}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Misafir:</span>
                    <span className="font-medium">{order.guestIdentifier}</span>
                  </div>
                  
                  
                )}
             
                {order.shoppingCartId && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Sepet ID:</span>
                    <span className="font-medium">{order.shoppingCartId}</span>
                  </div>
                  
                )}
            {order.customerFirstName && (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Ad:</span>
          <span className="font-medium">{order.customerFirstName}</span>
        </div>
      )}
      {order.customerLastName && (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Soyad:</span>
          <span className="font-medium">{order.customerLastName}</span>
        </div>
      )}
      {order.customerEmail && (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Email:</span>
          <span className="font-medium">{order.customerEmail}</span>
        </div>
      )}
      {order.customerPhone && (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Telefon:</span>
          <span className="font-medium">{order.customerPhone}</span>
        </div>
      )}
                
                {order.paymentMethodId && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Ödeme Yöntemi ID:</span>
                    <span className="font-medium">{order.paymentMethodId}</span>
                  </div>
                )}
                
                {order.shippingMethodId && (
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Kargo Yöntemi ID:</span>
                    <span className="font-medium">{order.shippingMethodId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-600">
                <X className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
    </GenericPageLayout>
  )
}
