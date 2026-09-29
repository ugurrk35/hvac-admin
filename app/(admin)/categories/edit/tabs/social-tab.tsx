"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type {  UpdateCategoryPayload } from "@/lib/types"

interface Props {
  formData: UpdateCategoryPayload
  setFormData: React.Dispatch<React.SetStateAction<UpdateCategoryPayload>>
}

export function SocialTab({ formData, setFormData }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ogTitle">Open Graph Başlık</Label>
        <Input
          id="ogTitle"
          value={formData.ogTitle}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, ogTitle: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ogDescription">Open Graph Açıklama</Label>
        <Textarea
          id="ogDescription"
          value={formData.ogDescription}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, ogDescription: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ogImage">Open Graph Görsel URL</Label>
        <Input
          id="ogImage"
          value={formData.ogImage}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, ogImage: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="twitterCardType">Twitter Card Tipi</Label>
        <Select
          value={formData.twitterCardType}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, twitterCardType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Twitter kart tipi seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Summary</SelectItem>
            <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
            <SelectItem value="app">App</SelectItem>
            <SelectItem value="player">Player</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
