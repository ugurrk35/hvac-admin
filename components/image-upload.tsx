"use client"

import type React from "react"

import { useState } from "react"
import { ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onUpload: (files: FileList) => void
  className?: string
}

export function ImageUpload({ onUpload, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      onUpload(e.dataTransfer.files)
    }
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed border-palette-lightBlue rounded-lg p-4 transition-colors",
        isDragging && "border-palette-blue bg-palette-lightBlue/10",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && onUpload(e.target.files)}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer p-6">
        <ImagePlus className="h-12 w-12 text-palette-blue mb-4" />
        <p className="text-sm text-muted-foreground text-center mb-2">
          Drag and drop your product images here, or click to select
        </p>
        <p className="text-xs text-muted-foreground">Supports: JPG, PNG, WEBP (Max 5MB each)</p>
      </label>
    </div>
  )
}
