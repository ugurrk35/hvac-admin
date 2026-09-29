"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import RichTextEditor from "@/components/RichTextEditor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImagePlus, X, ChevronRight, ChevronLeft, Plus, Trash2, Loader2, Tag } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type {
  CreateProductPayloadNew,
  AttributeCombination,
  LookupCategory,
  LookupProductAttribute,
  LookupProductAttributeValue,
  UploadedImage,
  ProductTag,
  CreateProductTagPayload,
  ProductImage,
} from "@/lib/types"
import type { ProductListItemNew } from "@/lib/types"
import { lookupApi, productsApi, imagesApi, productTagApi } from "@/lib/api"

type TabType = "basics" | "seo" | "social" | "product-info" | "tags" | "images" | "attributes"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL tanımlı değil.")

export default function AddProductPage() {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<TabType>("basics")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lookup data
  const [categories, setCategories] = useState<LookupCategory[]>([])
  const [productAttributes, setProductAttributes] = useState<LookupProductAttribute[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, LookupProductAttributeValue[]>>({})

  // ProductTag data
  const [newTagName, setNewTagName] = useState("")
  const [creatingTag, setCreatingTag] = useState(false)
  const [createdTags, setCreatedTags] = useState<ProductTag[]>([]) // Sadece oluşturulan etiketleri tut

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    slug: "",
    sku: "",
    shortDescription: "",
    description: "",
    basePrice: 0.01,
    discountPrice: 0.01,
    isPublished: true,
    quantity: 0,
    categoryId: 0,
    additionalCategoryIds: [] as number[],
  })

  // SEO State
  const [seoInfo, setSeoInfo] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
  })

  // Social Media State
  const [socialInfo, setSocialInfo] = useState({
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCardType: "",
  })

  // Product Info State
  const [productInfo, setProductInfo] = useState({
    brand: "",
    brandLogoUrl: "",
    cardHighlights: [] as string[],
    gtin: "",
    mpn: "",
    technicalDetails: "",
    deliveryInstallationDetails: "",
    documentsDetails: "",
  })

  // Images State - Yeni yapı ile API entegrasyonu
  const [images, setImages] = useState<UploadedImage[]>([])

  // Attributes State
  const [attributeCombinations, setAttributeCombinations] = useState<AttributeCombination[]>([])

  // Related products state
  const [relatedSearch, setRelatedSearch] = useState("")
  const [relatedResults, setRelatedResults] = useState<Array<{ id: number; name: string }>>([])
  const [selectedRelated, setSelectedRelated] = useState<Array<{ id: number; name: string }>>([])

  // Type guard functions
const isValidProductAttribute = (attr: unknown): attr is LookupProductAttribute => {
  return attr !== null &&
    typeof attr === 'object' &&
    'id' in attr &&
    'name' in attr &&
    'productAttributeValues' in attr &&
    typeof (attr as Record<string, unknown>).id === 'number' &&
    typeof (attr as Record<string, unknown>).name === 'string' &&
    Array.isArray((attr as Record<string, unknown>).productAttributeValues)
}

const isValidProductAttributeValue = (val: unknown): val is LookupProductAttributeValue => {
  return val !== null &&
    typeof val === 'object' &&
    'id' in val &&
    'productAttributeId' in val &&
    typeof (val as Record<string, unknown>).id === 'number' &&
    typeof (val as Record<string, unknown>).productAttributeId === 'number' &&
    // name is optional, so only check if it exists
    (
      !('name' in val) || 
      (val as Record<string, unknown>).name === undefined ||
      typeof (val as Record<string, unknown>).name === 'string'
    )
}


const isValidCategory = (cat: unknown): cat is LookupCategory => {
  return cat !== null &&
    typeof cat === 'object' &&
    'id' in cat &&
    'name' in cat &&
    typeof (cat as Record<string, unknown>).id === 'number' &&
    typeof (cat as Record<string, unknown>).name === 'string'
}

  // Lookup verilerini yükle
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        // Kategorileri yükle
        try {
          const categoriesResponse = await lookupApi.getCategories()
          if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
            const validCategories = categoriesResponse.data
              .filter(isValidCategory)
              .map(cat => ({ ...cat, id: cat.id ?? 0 }))
            setCategories(validCategories)
          }
        } catch (error) {
          setCategories([])
        }

        // Product attribute'ları yükle
       try {
  const attributesResponse = await lookupApi.getProductAttributes()
  if (attributesResponse.success && Array.isArray(attributesResponse.data)) {
    // Tüm özellikleri yükle ve type safety sağla
    const mappedAttributes: LookupProductAttribute[] = attributesResponse.data
      .filter(isValidProductAttribute)
      .map(attr => {
        return {
          ...attr,
          id: attr.id ?? 0,
          isPersonalization: attr.isPersonalization ?? false, // Ensure isPersonalization is set
          productAttributeValues: Array.isArray(attr.productAttributeValues) 
            ? attr.productAttributeValues
                .filter(isValidProductAttributeValue)
                .map(val => ({
                  ...val,
                  id: val.id ?? 0,
                  productAttributeId: val.productAttributeId ?? attr.id // Fix: Use parent attribute ID as fallback
                }))
            : []
        }
      })
    
    // Eğer hiç attribute yoksa, API'den tekrar yüklemeyi dene
    if (mappedAttributes.length === 0) {
      // Alternative: try to load attributes without filtering first
      const allAttributes: LookupProductAttribute[] = attributesResponse.data.map((attr: unknown) => {
        const attrObj = attr as Record<string, unknown>
        return {
          ...attrObj,
          id: attrObj.id ?? 0,
          name: attrObj.name ?? '',
          isPersonalization: attrObj.isPersonalization ?? false,
          productAttributeValues: Array.isArray(attrObj.productAttributeValues) 
            ? attrObj.productAttributeValues.map((val: unknown) => {
                const valObj = val as Record<string, unknown>
                return {
                  ...valObj,
                  id: valObj.id ?? 0,
                  productAttributeId: valObj.productAttributeId ?? attrObj.id
                }
              })
            : []
        } as LookupProductAttribute
      })
      setProductAttributes(allAttributes)
    } else {
      setProductAttributes(mappedAttributes)
      
      // Preload attribute values if they're already available in the attribute object
      mappedAttributes.forEach(attr => {
        if (attr.productAttributeValues && attr.productAttributeValues.length > 0) {
          setAttributeValues(prev => ({
            ...prev,
            [attr.id.toString()]: attr.productAttributeValues
          }))
        }
      })
    }
  } else {
    }
} catch (error) {
  setProductAttributes([])
}
      } catch (error) {
        // Genel hata durumunda sadece log yap, sayfa çalışmaya devam etsin
      }
    }

    loadLookupData()
  }, [])

  // Yeni etiket oluştur
  const createNewTag = async () => {
    if (!newTagName.trim()) {
      alert("Lütfen etiket adı girin")
      return
    }

    try {
      setCreatingTag(true)
      // Slug oluştur
      const slug = newTagName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      const payload: CreateProductTagPayload = {
        name: newTagName.trim(),
        slug,
        isActive: true,
      }

      const response = await productTagApi.createProductTag(payload)
     if (response.success && response.data) {
  // Yeni etiketi listeye ekle, undefined olma ihtimaline karşı filtrele
  setCreatedTags((prev) => [...prev, response.data as ProductTag])

  // Input'u temizle
  setNewTagName("")

  alert(`"${response.data.name}" etiketi başarıyla oluşturuldu!`)
} else {
  throw new Error(response.message || "Etiket oluşturma başarısız")
}
    } catch (error) {
      alert(`Etiket oluşturma hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
    } finally {
      setCreatingTag(false)
    }
  }

  // Oluşturulan etiketi sil - Fixed type issue
  const removeCreatedTag = (id: number) => {
    setCreatedTags((prev) => prev.filter((tag): tag is ProductTag => tag !== undefined && tag.id !== id))
  }

  // Attribute değerlerini yükle - Edit sayfasındaki çalışan koda göre düzeltildi
  const loadAttributeValues = async (attributeId: number) => {
    // Geçersiz bir ID gelirse fonksiyonu erken sonlandır.
    if (!attributeId || attributeId === 0) return [];

    // State anahtarı olarak kullanmak için ID'yi string'e çevir.
    const attributeIdStr = attributeId.toString();

    try {
      // İlgili özelliğin isPersonalization değerini kontrol et
      const attribute = productAttributes.find(attr => attr.id === attributeId)
      if (attribute?.isPersonalization) {
        return []
      }

      // Önbellek kontrolünü (cache check) string anahtar ile yap.
      if (attributeValues[attributeIdStr]) {
        return attributeValues[attributeIdStr];
      }

      const response = await lookupApi.getProductAttributeValues(attributeId);
      if (response.success && response.data) {
        setAttributeValues((prev) => {
          return {
            ...prev,
            [attributeIdStr]: response.data ?? [],
          };
        });
        return response.data;
      } else {
        // Hata durumunda bile state'i boş bir dizi ile doldurmak,
        // sürekli aynı hatalı isteğin yapılmasını engeller.
        setAttributeValues((prev) => ({ ...prev, [attributeIdStr]: [] }));
        return [];
      }
    } catch (error) {
      alert(`Attribute değerleri yüklenirken hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
      return [];
    }
  }

  // Resim yükleme fonksiyonu - API entegrasyonu ile
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(async (file, index) => {
      // Dosya adından otomatik title, altText, caption oluştur
      const fileName = file.name.replace(/\.[^/.]+$/, "") // Uzantıyı kaldır
      const autoTitle = fileName.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

      // Önce local preview için state'e ekle
      const tempId = Date.now() + index
      const reader = new FileReader()

      reader.onloadend = () => {
        const newImage: UploadedImage = {
          id: tempId, // Geçici ID
          file,
          url: reader.result as string, // Local preview URL
          sortOrder: images.length + index,
          title: autoTitle,
          altText: autoTitle,
          caption: autoTitle,
          fileName: file.name,
          uploading: true,
        }

        setImages((prev) => [...prev, newImage])

        // API'ye yükle
        uploadImageToApi(file, tempId, autoTitle)
      }

      reader.readAsDataURL(file)
    })
  }

  // API'ye resim yükleme
  const uploadImageToApi = async (file: File, tempId: number, autoTitle: string) => {
    try {
      const response = await imagesApi.uploadImage(file, autoTitle, autoTitle, autoTitle)
      if (response.success && response.data) {
        // API'den dönen URL'yi tam URL'ye çevir
  //      const fullImageUrl = response.data.url.startsWith("http")
  // ? response.data.url
  // : `${API_BASE_URL}${response.data.url.replace(/^\/+/, "")}`;
  const fullImageUrl = response.data.url.startsWith("http")
  ? response.data.url
  : `${API_BASE_URL}${response.data.url}`;
        // State'i gerçek API verisi ile güncelle
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? {
                  ...img,
                  id: response.data!.id, // Gerçek API ID'si
                  title: response.data!.title,
                  altText: response.data!.altText,
                  caption: response.data!.caption,
                  fileName: response.data!.fileName,
                  uploading: false,
                  url: fullImageUrl, // Tam URL kullan
                }
              : img,
          ),
        )
      } else {
        throw new Error(response.message || "Resim yükleme başarısız")
      }
    } catch (error) {
      // Hata durumunda state'i güncelle
      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId
            ? {
                ...img,
                uploading: false,
                uploadError: error instanceof Error ? error.message : "Resim yükleme hatası",
              }
            : img,
        ),
      )

      alert(`Resim yükleme hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
    }
  }

  const removeImage = (id: number) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id)
      return filtered.map((img, i) => ({ ...img, sortOrder: i }))
    })
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const [movedImage] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, movedImage)
      return newImages.map((img, i) => ({ ...img, sortOrder: i }))
    })
  }

  // Resim bilgilerini güncelleme
  const updateImageInfo = (id: number, field: "title" | "altText" | "caption", value: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)))
  }

  const addAttributeCombination = () => {
    setAttributeCombinations((prev) => {
      const newCombination = {
        sku: "",
        price: 0,
        quantity: 0,
        attributeValues: [],
      }
      return [...prev, newCombination]
    })
  }

  const removeAttributeCombination = (index: number) => {
    setAttributeCombinations((prev) => prev.filter((_, i) => i !== index))
  }

  const addAttributeValue = (combinationIndex: number) => {
    setAttributeCombinations((prev) => {
      // Yeni attribute değeri
      const newAttributeValue = {
        productAttributeId: 0,
        productAttributeValueId: 0,
      }
      return prev.map((combination, i) =>
        i === combinationIndex
          ? {
              ...combination,
              attributeValues: [...combination.attributeValues, newAttributeValue],
            }
          : combination,
      )
    })
  }

  const removeAttributeValue = (combinationIndex: number, valueIndex: number) => {
    setAttributeCombinations((prev) =>
      prev.map((combination, i) =>
        i === combinationIndex
          ? {
              ...combination,
              attributeValues: combination.attributeValues.filter((_, vi) => vi !== valueIndex),
            }
          : combination,
      ),
    )
  }

  const updateAttributeValue = async (
    combinationIndex: number,
    valueIndex: number,
    field: "productAttributeId" | "productAttributeValueId",
    value: number,
  ) => {
    // Önce state'i güncelle
    setAttributeCombinations((prev) => {
      const updated = [...prev]

      // Eğer productAttributeId değişiyorsa, productAttributeValueId'yi sıfırla
      if (field === "productAttributeId") {
        if (updated[combinationIndex]?.attributeValues[valueIndex]) {
          updated[combinationIndex].attributeValues[valueIndex] = {
            ...updated[combinationIndex].attributeValues[valueIndex],
            [field]: value,
            productAttributeValueId: 0, // Attribute değiştiğinde value'yu sıfırla
          }
        }
      } else {
        // Normal güncelleme
        if (updated[combinationIndex]?.attributeValues[valueIndex]) {
          updated[combinationIndex].attributeValues[valueIndex] = {
            ...updated[combinationIndex].attributeValues[valueIndex],
            [field]: value,
          }
        }
      }

      return updated
    })

    // Eğer productAttributeId değişiyorsa, ve özellik personalizasyon değilse değerleri yükle
    if (field === "productAttributeId" && value > 0) {
      const selectedAttribute = productAttributes.find(attr => attr.id === value)
      if (!selectedAttribute?.isPersonalization) {
        try {
          await loadAttributeValues(value)
        } catch (error) {
          }
      }
    }
  }

  const handleNameChange = (value: string) => {
    setBasicInfo((prev) => ({
      ...prev,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim(),
    }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Yüklenmekte olan resimler var mı kontrol et
      const uploadingImages = images.filter((img) => img.uploading)
      if (uploadingImages.length > 0) {
        throw new Error("Lütfen tüm resimlerin yüklenmesini bekleyin.")
      }

      // Yükleme hatası olan resimler var mı kontrol et
      const errorImages = images.filter((img) => img.uploadError)
      if (errorImages.length > 0) {
        throw new Error("Bazı resimler yüklenemedi. Lütfen hatalı resimleri kaldırın veya tekrar yükleyin.")
      }

      // Oluşturulan etiketlerin ID'lerini al
      const productTagIds = createdTags.length > 0 ? createdTags.map((tag) => tag.id) : null

      // Geçerli kombinasyonları kontrol et
      const validCombinations = attributeCombinations.filter((combo) => {
        return combo.sku && combo.attributeValues.every((av) => {
          // Özelliğin personalizasyon olup olmadığını kontrol et
          const attribute = productAttributes.find(attr => attr.id === av.productAttributeId)
          if (attribute?.isPersonalization) {
            // Personalizasyon özelliği için sadece productAttributeId zorunlu
            return av.productAttributeId > 0
          } else {
            // Normal özellik için hem productAttributeId hem de productAttributeValueId zorunlu
            return av.productAttributeId > 0 && av.productAttributeValueId > 0
          }
        })
      })

      // Ürün resimlerini oluştur
      const productImages: ProductImage[] = images.map((image) => ({
        imageId: image.id,
        sortOrder: image.sortOrder,
        title: image.title,
        altText: image.altText,
        caption: image.caption,
      }))

      // Fixed type issue with proper typing
      const payload: CreateProductPayloadNew & Record<string, unknown> = {
        ...basicInfo,
        ...seoInfo,
        ...socialInfo,
        ...productInfo,
        ...(productTagIds && { productTagIds }), // Sadece etiket varsa ekle
        productImages,
        ...(validCombinations.length > 0 && { attributeCombinations: validCombinations }), // Sadece kombinasyon varsa ekle
        ...(selectedRelated.length > 0 && { relatedProductIds: selectedRelated.slice(0, 4).map(x => x.id) }),
      }
      const response = await productsApi.createProduct(payload)
      alert("Ürün başarıyla kaydedildi!")
      router.push("/products")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ürün kaydedilirken bir hata oluştu")
      alert(`Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "basics", label: "Temel Bilgiler" },
    { id: "seo", label: "SEO" },
    { id: "social", label: "Sosyal Medya" },
    { id: "product-info", label: "Ürün Bilgileri" },
    { id: "tags", label: "Etiketler" },
    { id: "images", label: "Görseller" },
    { id: "attributes", label: "Özellikler" },
  ]

  const canProceed = () => {
    switch (currentTab) {
      case "basics":
        return basicInfo.name && basicInfo.sku && basicInfo.categoryId && basicInfo.basePrice > 0
      case "seo":
        return true // SEO alanları artık zorunlu değil (backend'de optional)
      case "social":
        return true // Optional fields
      case "product-info":
        return true // Optional fields
      case "tags":
        return true // Optional
      case "images":
        return true // Optional for now
      case "attributes":
        // Eğer hiç kombinasyon yoksa, kaydetmeye izin ver
        if (attributeCombinations.length === 0) {
          return true
        }
        // Eğer kombinasyon varsa, SKU ve price zorunlu (backend DTO'da required)
        return attributeCombinations.every(
          (combo) =>
            combo.sku && // SKU zorunlu
            combo.price >= 0 && // Price zorunlu ve 0 veya pozitif olmalı
            combo.quantity >= 0 && // Quantity 0 veya pozitif olmalı
            combo.attributeValues.every((av) => {
              // Özelliğin personalizasyon olup olmadığını kontrol et
              const attribute = productAttributes.find(attr => attr.id === av.productAttributeId)
              if (attribute?.isPersonalization) {
                // Personalizasyon özelliği için sadece productAttributeId zorunlu
                return av.productAttributeId > 0
              } else {
                // Normal özellik için hem productAttributeId hem de productAttributeValueId zorunlu
                return av.productAttributeId > 0 && av.productAttributeValueId > 0
              }
            }),
        )
      default:
        return true
    }
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case "basics":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı</Label>
              <Input
                id="name"
                value={basicInfo.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Ek vitrin kategorileri</Label>
              <p className="text-xs text-muted-foreground">Ana kategori korunur. Ürün, seçtiğiniz ek vitrin kategorilerinde de listelenir.</p>
              <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                {categories.filter((category) => category.id !== basicInfo.categoryId).map((category) => (
                  <label className="flex items-center gap-2 text-sm" key={category.id}>
                    <input type="checkbox" checked={basicInfo.additionalCategoryIds.includes(category.id)} onChange={(event) => setBasicInfo((current) => ({ ...current, additionalCategoryIds: event.target.checked ? [...current.additionalCategoryIds, category.id] : current.additionalCategoryIds.filter((id) => id !== category.id) }))} />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">SEO URL</Label>
              <Input
                id="slug"
                value={basicInfo.slug}
                onChange={(e) => setBasicInfo((prev) => ({ ...prev, slug: e.target.value }))}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={basicInfo.sku}
                onChange={(e) => setBasicInfo((prev) => ({ ...prev, sku: e.target.value }))}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={basicInfo.categoryId > 0 ? basicInfo.categoryId.toString() : undefined}
                onValueChange={(value) => setBasicInfo((prev) => ({ ...prev, categoryId: Number(value) }))}
              >
                <SelectTrigger className="border-palette-lightBlue">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Kısa Açıklama</Label>
              <div className="min-h-[150px] border rounded-md border-input">
                <RichTextEditor
                  value={basicInfo.shortDescription || ""}
                  onChange={(value) =>
                    setBasicInfo((prev) => ({ ...prev, shortDescription: value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detaylı Açıklama</Label>
              <div className="min-h-[300px] border rounded-md border-input">
                <RichTextEditor
                  value={basicInfo.description || ""}
                  onChange={(value) =>
                    setBasicInfo((prev) => ({ ...prev, description: value }))
                  }
                />
              </div>
            
            </div>

            {/* İlgili Ürünler (opsiyonel, max 4) */}
            <div className="space-y-3">
              <Label>İlgili Ürünler (en fazla 4 adet)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ürün ara... (en az 3 harf)"
                  value={relatedSearch}
                  onChange={async (e) => {
                    const term = e.target.value;
                    setRelatedSearch(term);
                    if (term && term.length >= 3) {
                      try {
                        const res = await productsApi.getProducts({ page: 1, pageSize: 10, search: term });
                        const items = (res.items ?? []).map((x: ProductListItemNew) => ({ id: x.id, name: x.name }));
                        setRelatedResults(items);
                      } catch {
                        setRelatedResults([]);
                      }
                    } else {
                      setRelatedResults([]);
                    }
                  }}
                />
              </div>
              {relatedResults.length > 0 && (
                <div className="border rounded-md p-2 max-h-48 overflow-auto">
                  {relatedResults.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{r.name}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (selectedRelated.find((x) => x.id === r.id)) return;
                          if (selectedRelated.length >= 4) return;
                          setSelectedRelated((prev) => [...prev, r]);
                        }}
                        disabled={selectedRelated.length >= 4 || selectedRelated.some((x) => x.id === r.id)}
                      >
                        Ekle
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {selectedRelated.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedRelated.map((r) => (
                    <div key={r.id} className="px-2 py-1 rounded-full bg-neutral-100 text-sm flex items-center gap-2">
                      <span>{r.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRelated((prev) => prev.filter((x) => x.id !== r.id))}
                        aria-label="Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Temel Fiyat</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={basicInfo.basePrice}
                  onChange={(e) => setBasicInfo((prev) => ({ ...prev, basePrice: Number(e.target.value) }))}
                  className="border-palette-lightBlue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPrice">İndirimli Fiyat</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={basicInfo.discountPrice}
                  onChange={(e) => setBasicInfo((prev) => ({ ...prev, discountPrice: Number(e.target.value) }))}
                  className="border-palette-lightBlue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Stok Miktarı</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={basicInfo.quantity}
                  onChange={(e) => setBasicInfo((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="border-palette-lightBlue"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={basicInfo.isPublished}
                onCheckedChange={(checked) => setBasicInfo((prev) => ({ ...prev, isPublished: checked }))}
              />
              <Label htmlFor="isPublished">Yayınlanmış</Label>
            </div>
          </div>
        )

      case "seo":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Başlık</Label>
              <Input
                id="metaTitle"
                value={seoInfo.metaTitle}
                onChange={(e) => setSeoInfo((prev) => ({ ...prev, metaTitle: e.target.value }))}
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Açıklama</Label>
              <Textarea
                id="metaDescription"
                value={seoInfo.metaDescription}
                onChange={(e) => setSeoInfo((prev) => ({ ...prev, metaDescription: e.target.value }))}
                className="min-h-[100px] border-palette-lightBlue"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaKeywords">Meta Anahtar Kelimeler</Label>
              <Input
                id="metaKeywords"
                value={seoInfo.metaKeywords}
                onChange={(e) => setSeoInfo((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                value={seoInfo.canonicalUrl}
                onChange={(e) => setSeoInfo((prev) => ({ ...prev, canonicalUrl: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>
          </div>
        )

      case "social":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ogTitle">Open Graph Başlık</Label>
              <Input
                id="ogTitle"
                value={socialInfo.ogTitle}
                onChange={(e) => setSocialInfo((prev) => ({ ...prev, ogTitle: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogDescription">Open Graph Açıklama</Label>
              <Textarea
                id="ogDescription"
                value={socialInfo.ogDescription}
                onChange={(e) => setSocialInfo((prev) => ({ ...prev, ogDescription: e.target.value }))}
                className="min-h-[100px] border-palette-lightBlue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogImage">Open Graph Görsel URL</Label>
              <Input
                id="ogImage"
                value={socialInfo.ogImage}
                onChange={(e) => setSocialInfo((prev) => ({ ...prev, ogImage: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterCardType">Twitter Card Tipi</Label>
              <Select
                value={socialInfo.twitterCardType || undefined}
                onValueChange={(value) => setSocialInfo((prev) => ({ ...prev, twitterCardType: value }))}
              >
                <SelectTrigger className="border-palette-lightBlue">
                  <SelectValue placeholder="Twitter card tipi seçin" />
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

      case "product-info":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marka</Label>
              <Input
                id="brand"
                value={productInfo.brand}
                onChange={(e) => setProductInfo((prev) => ({ ...prev, brand: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandLogoUrl">Marka logo URL</Label>
              <Input id="brandLogoUrl" value={productInfo.brandLogoUrl} onChange={(e) => setProductInfo((prev) => ({ ...prev, brandLogoUrl: e.target.value }))} placeholder="https://.../marka-logo.png" className="border-palette-lightBlue" />
              <p className="text-xs text-muted-foreground">Kartta marka adının yerine bu logo gösterilir.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardHighlights">Ürün kartı kısa maddeleri</Label>
              <Textarea id="cardHighlights" value={productInfo.cardHighlights.join("\n")} onChange={(e) => setProductInfo((prev) => ({ ...prev, cardHighlights: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 3) }))} placeholder={"Her satıra bir fayda yazın\nEn fazla 3 madde gösterilir"} rows={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtin">GTIN</Label>
              <Input
                id="gtin"
                value={productInfo.gtin}
                onChange={(e) => setProductInfo((prev) => ({ ...prev, gtin: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mpn">MPN</Label>
              <Input
                id="mpn"
                value={productInfo.mpn}
                onChange={(e) => setProductInfo((prev) => ({ ...prev, mpn: e.target.value }))}
                className="border-palette-lightBlue"
              />
            </div>
            <div className="space-y-2"><Label htmlFor="technicalDetails">Teknik bilgiler sekmesi</Label><Textarea id="technicalDetails" value={productInfo.technicalDetails} onChange={(e) => setProductInfo((prev) => ({ ...prev, technicalDetails: e.target.value }))} placeholder="Kapasite, verimlilik, ölçü ve diğer ürün teknik bilgileri" /></div>
            <div className="space-y-2"><Label htmlFor="deliveryInstallationDetails">Teslimat & montaj sekmesi</Label><Textarea id="deliveryInstallationDetails" value={productInfo.deliveryInstallationDetails} onChange={(e) => setProductInfo((prev) => ({ ...prev, deliveryInstallationDetails: e.target.value }))} placeholder="Bu ürüne özel teslimat, montaj ve uygunluk koşulları" /></div>
            <div className="space-y-2"><Label htmlFor="documentsDetails">Dokümanlar sekmesi</Label><Textarea id="documentsDetails" value={productInfo.documentsDetails} onChange={(e) => setProductInfo((prev) => ({ ...prev, documentsDetails: e.target.value }))} placeholder="Garanti, katalog veya dokümanlar için açıklama" /></div>
          </div>
        )

      case "tags":
        return (
          <div className="space-y-6">
            {/* Yeni Etiket Oluşturma */}
            <Card className="p-4 bg-blue-50">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-palette-blue" />
                  <Label className="text-lg font-medium">Yeni Etiket Oluştur</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Etiket adı girin (örn: Yeni Ürün, İndirimli, Popüler)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 border-palette-lightBlue"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        createNewTag()
                      }
                    }}
                  />
                  <Button
                    onClick={createNewTag}
                    disabled={!newTagName.trim() || creatingTag}
                    className="bg-palette-blue hover:bg-palette-lightBlue"
                  >
                    {creatingTag ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Oluştur
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Oluşturduğunuz etiketler ürüne eklenecek ve ürün kaydedilirken API&apos;ye gönderilecektir.
                </p>
              </div>
            </Card>

            {/* Oluşturulan Etiketler */}
            {createdTags.length > 0 && (
              <Card className="p-4 bg-green-50">
                <div className="space-y-4">
                  <Label className="text-lg font-medium">Oluşturulan Etiketler</Label>
                  <div className="flex flex-wrap gap-2">
                    {createdTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-palette-blue text-black hover:bg-palette-lightBlue flex items-center gap-1 px-3 py-1.5"
                      >
                        <span>{tag.name}</span>
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCreatedTag(tag.id)
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Bu etiketler ürün kaydedilirken API&apos;ye gönderilecek. Silmek için etikete tıklayın.
                  </p>
                </div>
              </Card>
            )}

            {/* Etiket Oluşturma Bilgisi */}
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2">
                <h3 className="font-medium">Etiket Oluşturma Bilgisi</h3>
                <p className="text-sm text-gray-600">
                  Oluşturduğunuz etiketler otomatik olarak ürüne eklenecektir. Ürün kaydedildiğinde, bu etiketlerin
                  ID&apos;leri API&apos;ye gönderilecektir.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>API Endpoint:</strong> POST /ProductTag
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Payload:</strong> {`{ "name": "string", "slug": "string", "isActive": true }`}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Response:</strong>{" "}
                  {`{ "data": { "id": 1, "name": "string", "slug": "string", "isActive": true }, "success": true }`}
                </p>
              </div>
            </Card>
          </div>
        )

      case "images":
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-palette-lightBlue rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer p-6">
                <ImagePlus className="h-12 w-12 text-palette-blue mb-4" />
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Ürün görsellerini buraya sürükleyin veya seçmek için tıklayın
                </p>
                <p className="text-xs text-muted-foreground">
                  Desteklenen: JPG, PNG, WEBP (Max 5MB) - Resimler otomatik olarak yüklenecek
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="space-y-4">
                <Label>Yüklenen Görseller</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {images.map((image, index) => (
                    <Card key={image.id} className="p-4">
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="relative aspect-video rounded-lg overflow-hidden border">
                            <Image
                              src={image.url || "/placeholder.svg"}
                              alt={image.altText || "Product image"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              onError={(e) => {
                                // Hata durumunda placeholder göster
                                e.currentTarget.src = "/placeholder.svg"
                              }}
                            />
                            {image.uploading && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-black text-center">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                  <p className="text-sm">Yükleniyor...</p>
                                </div>
                              </div>
                            )}
                            {image.uploadError && (
                              <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                                <div className="text-black
                                 text-center p-2">
                                  <p className="text-sm font-medium">Yükleme Hatası</p>
                                  <p className="text-xs">{image.uploadError}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="absolute top-2 left-2 bg-black/70 text-black px-2 py-1 rounded text-xs">
                            #{index + 1}
                          </div>

                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeImage(image.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor={`title-${image.id}`} className="text-xs">
                              Başlık
                            </Label>
                            <Input
                              id={`title-${image.id}`}
                              value={image.title}
                              onChange={(e) => updateImageInfo(image.id, "title", e.target.value)}
                              className="h-8 text-sm"
                              disabled={image.uploading}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`altText-${image.id}`} className="text-xs">
                              Alt Text
                            </Label>
                            <Input
                              id={`altText-${image.id}`}
                              value={image.altText}
                              onChange={(e) => updateImageInfo(image.id, "altText", e.target.value)}
                              className="h-8 text-sm"
                              disabled={image.uploading}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`caption-${image.id}`} className="text-xs">
                              Açıklama
                            </Label>
                            <Input
                              id={`caption-${image.id}`}
                              value={image.caption}
                              onChange={(e) => updateImageInfo(image.id, "caption", e.target.value)}
                              className="h-8 text-sm"
                              disabled={image.uploading}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveImage(index, Math.max(0, index - 1))}
                            disabled={index === 0 || image.uploading}
                            className="flex-1"
                          >
                            ← Yukarı
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveImage(index, Math.min(images.length - 1, index + 1))}
                            disabled={index === images.length - 1 || image.uploading}
                            className="flex-1"
                          >
                            Aşağı →
                          </Button>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            <strong>Dosya:</strong> {image.fileName}
                          </p>
                          <p>
                            <strong>API ID:</strong> {image.uploading ? "Yükleniyor..." : image.id}
                          </p>
                          <p>
                            <strong>URL:</strong> {image.uploading ? "Yükleniyor..." : image.url}
                          </p>
                          {image.uploadError && (
                            <p className="text-red-500">
                              <strong>Hata:</strong> {image.uploadError}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "attributes":
        return (
          <div className="space-y-4">
            <Button
              type="button"
              onClick={addAttributeCombination}
              className="bg-black hover:bg-palette-lightBlue text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Özellik Kombinasyonu Ekle
            </Button>

            {attributeCombinations.map((combination, combinationIndex) => (
              <Card key={combinationIndex} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Kombinasyon {combinationIndex + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-100"
                      onClick={() => removeAttributeCombination(combinationIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={combination.sku}
                        onChange={(e) =>
                          setAttributeCombinations((prev) =>
                            prev.map((c, i) => (i === combinationIndex ? { ...c, sku: e.target.value } : c)),
                          )
                        }
                        className="border-palette-lightBlue"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fiyat</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={combination.price}
                        onChange={(e) =>
                          setAttributeCombinations((prev) =>
                            prev.map((c, i) => (i === combinationIndex ? { ...c, price: Number(e.target.value) } : c)),
                          )
                        }
                        className="border-palette-lightBlue"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Miktar</Label>
                      <Input
                        type="number"
                        min="0"
                        value={combination.quantity}
                        onChange={(e) =>
                          setAttributeCombinations((prev) =>
                            prev.map((c, i) =>
                              i === combinationIndex ? { ...c, quantity: Number(e.target.value) } : c,
                            ),
                          )
                        }
                        className="border-palette-lightBlue"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Özellik Değerleri</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addAttributeValue(combinationIndex)}
                        className="border-palette-lightBlue"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Özellik Ekle
                      </Button>
                    </div>

                    {combination.attributeValues.map((attributeValue, valueIndex) => (
                      <div key={valueIndex} className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                          <Label>Özellik</Label>
                          <Select
                            value={
                              attributeValue.productAttributeId > 0
                                ? attributeValue.productAttributeId.toString()
                                : undefined
                            }
                            onValueChange={async (value) => {
                              const attributeId = Number(value)
                              await updateAttributeValue(
                                combinationIndex,
                                valueIndex,
                                "productAttributeId",
                                attributeId,
                              )

                              // Özellik seçildiğinde hemen değerleri yükle
                              if (attributeId > 0) {
                                await loadAttributeValues(attributeId)
                              }
                            }}
                          >
                            <SelectTrigger className="border-palette-lightBlue">
                              <SelectValue placeholder="Özellik seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {productAttributes.length > 0 ? (
                                productAttributes.map((attribute) => {
                                  return (
                                    <SelectItem key={attribute.id} value={attribute.id.toString()}>
                                      {attribute.name} {attribute.isPersonalization ? '(Kişiselleştirme)' : ''}
                                    </SelectItem>
                                  )
                                })
                              ) : (
                                <SelectItem value="loading" disabled>
                                  Özellikler yükleniyor... ({productAttributes.length} yüklendi)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <Label>Değer</Label>
                          {attributeValue.productAttributeId > 0 && 
                           productAttributes.find(attr => attr.id === attributeValue.productAttributeId)?.isPersonalization ? (
                            <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                              Bu bir kişiselleştirme özelliğidir. Değer seçimi yapılmayacaktır.
                            </div>
                          ) : (
                            <Select
                              value={
                                attributeValue.productAttributeValueId > 0
                                  ? attributeValue.productAttributeValueId.toString()
                                  : undefined
                              }
                              onValueChange={(value) =>
                                updateAttributeValue(
                                  combinationIndex,
                                  valueIndex,
                                  "productAttributeValueId",
                                  Number(value),
                                )
                              }
                              disabled={!attributeValue.productAttributeId || attributeValue.productAttributeId === 0}
                            >
                              <SelectTrigger className="border-palette-lightBlue">
                                <SelectValue placeholder="Değer seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {(() => {
                                  // Edit sayfasındaki gibi string key kullan
                                  const attributeIdStr = attributeValue.productAttributeId?.toString();
                                  const availableValues = attributeIdStr ? (attributeValues[attributeIdStr] || []) : [];
                                  
                                  if (attributeValue.productAttributeId > 0 && availableValues.length > 0) {
                                    return availableValues.map((value) => {
                                      return (
                                        <SelectItem key={value.id} value={value.id.toString()}>
                                          {value.name}
                                        </SelectItem>
                                      )
                                    })
                                  } else if (attributeValue.productAttributeId > 0) {
                                    return (
                                      <SelectItem value="loading" disabled>
                                        Değerler yükleniyor veya bulunamadı... (Attribute ID: {attributeValue.productAttributeId})
                                      </SelectItem>
                                    )
                                  } else {
                                    return (
                                      <SelectItem value="no-attribute" disabled>
                                        Önce özellik seçin
                                      </SelectItem>
                                    )
                                  }
                                })()}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-8 text-red-500 hover:text-red-600 hover:bg-red-100"
                          onClick={() => removeAttributeValue(combinationIndex, valueIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Yeni Ürün Ekle</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-7 gap-2 mb-6">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={cn(
              "p-3 text-xs text-center rounded-lg transition-colors",
              currentTab === tab.id
                ? "bg-palette-blue text-black font-semibold"
                : "bg-palette-lightBlue/20 text-palette-blue hover:bg-palette-lightBlue/30",
              index < tabs.findIndex((t) => t.id === currentTab) && "bg-palette-lightBlue text-black",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {renderTabContent()}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = tabs.findIndex((t) => t.id === currentTab)
              if (currentIndex > 0) {
                setCurrentTab(tabs[currentIndex - 1].id)
              }
            }}
            disabled={currentTab === "basics"}
            className="border-palette-lightBlue hover:bg-palette-lightBlue/20"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Önceki
          </Button>

          <div className="flex gap-2">
            {/* Kaydet butonu her tab'da görünsün */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Kaydediliyor..." : "Ürünü Kaydet"}
            </Button>

            {/* Sonraki butonu sadece son tab değilse göster */}
            {currentTab !== "attributes" && (
              <Button
                onClick={() => {
                  const currentIndex = tabs.findIndex((t) => t.id === currentTab)
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1].id)
                  }
                }}
                disabled={!canProceed()}
                className="bg-black hover:bg-palette-lightBlue"
              >
                Sonraki
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
