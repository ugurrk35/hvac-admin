"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"
import type { UpdateCategoryPayload } from "@/lib/types"

interface Props {
  formData: UpdateCategoryPayload
  setFormData: React.Dispatch<React.SetStateAction<UpdateCategoryPayload>>
}

export function BasicsTab({ formData, setFormData }: Props) {
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    setFormData((prev) => ({
      ...prev,
      name: value,
      slug,
    }))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Kategori Adı</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">SEO URL</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, slug: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <div className="min-h-[200px] border rounded-md">
          <RichTextEditor
            value={formData.description || ""}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
          />
        </div>
      </div>
    </div>
  )
}
