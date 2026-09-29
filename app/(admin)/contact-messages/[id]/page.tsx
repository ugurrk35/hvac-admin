"use client"
import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ContactMessage = {
  id: number
  name: string
  email: string
  subject?: string | null
  message: string
  createdAt: string
  isResolved: boolean
  resolvedAt?: string | null
  resolvedBy?: string | null
}

export default function ContactMessageDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`)
      const json = await res.json()
      setData(json?.data ?? null)
    } catch {
      alert("Kayıt yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { load() }, [load])

  const setResolved = async (value: boolean) => {
    setUpdating(true)
    try {
      await fetch(`/api/admin/contact-messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isResolved: value }) })
      await load()
    } catch { alert("Güncellenemedi") } finally { setUpdating(false) }
  }
  const remove = async () => {
    if (!confirm("Silinsin mi?")) return
    try {
      await fetch(`/api/admin/contact-messages/${id}`, { method: "DELETE" })
      router.push("/contact-messages")
    } catch { alert("Silinemedi") }
  }

  if (loading || !data) return <div>Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Mesaj #{data.id}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>router.back()}>Geri</Button>
          <Button variant="secondary" onClick={()=>setResolved(!data.isResolved)} disabled={updating}>{data.isResolved ? "Tekrar Aç" : "Kapat"}</Button>
          <Button variant="destructive" onClick={remove}>Sil</Button>
        </div>
      </div>
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Ad:</span> {data.name}</div>
          <div><span className="text-gray-500">E-posta:</span> {data.email}</div>
          <div className="md:col-span-2"><span className="text-gray-500">Konu:</span> {data.subject || '-'}</div>
          <div className="md:col-span-2"><span className="text-gray-500">Tarih:</span> {new Date(data.createdAt).toLocaleString('tr-TR')}</div>
          <div className="md:col-span-2"><span className="text-gray-500">Durum:</span> {data.isResolved ? 'Kapatıldı' : 'Açık'}</div>
        </div>
        <div className="mt-4">
          <div className="text-gray-500 mb-1 text-sm">Mesaj</div>
          <div className="whitespace-pre-line border rounded-md p-3 bg-gray-50">{data.message}</div>
        </div>
      </Card>
    </div>
  )
}
