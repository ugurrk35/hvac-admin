// Resim yükleme API'si
export interface ImageUploadResponse {
  success: boolean
  message?: string
  data?: {
    id: number
    fileName: string
    title: string
    altText: string
    caption: string
    url: string
  }
  errors?: string[]
}