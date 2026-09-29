"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {  UpdateCategoryPayload } from "@/lib/types"

interface Props {
  formData: UpdateCategoryPayload
  setFormData: React.Dispatch<React.SetStateAction<UpdateCategoryPayload>>
}

export function SeoTab({ formData, setFormData }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metaTitle">Meta Başlık</Label>
        <Input
          id="metaTitle"
          value={formData.metaTitle}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaDescription">Meta Açıklama</Label>
        <Textarea
          id="metaDescription"
          value={formData.metaDescription}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaKeywords">Meta Anahtar Kelimeler</Label>
        <Input
          id="metaKeywords"
          value={formData.metaKeywords}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="canonicalUrl">Canonical URL</Label>
        <Input
          id="canonicalUrl"
          value={formData.canonicalUrl}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, canonicalUrl: e.target.value }))
          }
        />
      </div>
    </div>
  )
}
