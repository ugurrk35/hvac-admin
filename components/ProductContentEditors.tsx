"use client"

import { useRef, useState } from "react"
import { FileText, Loader2, Upload } from "lucide-react"
import RichTextEditor from "@/components/RichTextEditor"
import { fetchMultipartApi } from "@/lib/api"

type ContentValues = {
  technicalDetails: string
  deliveryInstallationDetails: string
  documentsDetails: string
}

type UploadResponse = { data?: { url?: string; fileName?: string; documentType?: string } }

export function ProductContentEditors({ value, onChange }: { value: ContentValues; onChange: (next: ContentValues) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const update = (key: keyof ContentValues, next: string) => onChange({ ...value, [key]: next })
  const addFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files)
    if (!selected.length) return
    setUploading(true); setError("")
    try {
      const parts: string[] = []
      for (const file of selected) {
        const form = new FormData()
        form.append("file", file)
        const response = await fetchMultipartApi<UploadResponse>("/admin/product-documents/upload", form)
        const url = response.data?.url
        if (!url) throw new Error(`${file.name} yüklenemedi.`)
        const label = response.data?.fileName || file.name
        parts.push(response.data?.documentType === "Görsel"
          ? `<p><img src="${url}" alt="${label}" /></p>`
          : `<p><a href="${url}" download data-product-document="true">${label}</a></p>`)
      }
      update("documentsDetails", `${value.documentsDetails}${parts.join("")}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dosya yüklenemedi.")
    } finally { setUploading(false) }
  }
  return <div className="space-y-7">
    <section className="space-y-2"><div><h3 className="font-semibold">Teknik bilgiler</h3><p className="text-xs text-muted-foreground">Ürüne özel teknik bilgi, tablo, liste ve görsel içeriği.</p></div><RichTextEditor value={value.technicalDetails} onChange={(next) => update("technicalDetails", next)} /></section>
    <section className="space-y-2"><div><h3 className="font-semibold">Teslimat & montaj</h3><p className="text-xs text-muted-foreground">Teslimat koşulları, montaj kapsamı ve uygunluk notları.</p></div><RichTextEditor value={value.deliveryInstallationDetails} onChange={(next) => update("deliveryInstallationDetails", next)} /></section>
    <section className="space-y-3"><div><h3 className="font-semibold">Dokümanlar</h3><p className="text-xs text-muted-foreground">PDF veya görseli sürükleyip bırakın; link otomatik eklenir.</p></div>
      <div onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files) }} className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
        <input ref={inputRef} type="file" className="hidden" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => event.target.files && void addFiles(event.target.files)} />
        {uploading ? <Loader2 className="mx-auto size-7 animate-spin text-blue-600" /> : <Upload className="mx-auto size-7 text-blue-600" />}
        <p className="mt-2 text-sm font-medium">PDF veya görseli buraya bırakın</p><p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WebP · en fazla 10 MB</p>
        <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium" onClick={() => inputRef.current?.click()} disabled={uploading}><FileText className="size-4" />Klasörden seç</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <RichTextEditor value={value.documentsDetails} onChange={(next) => update("documentsDetails", next)} />
    </section>
  </div>
}
