"use client";

import type React from "react";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImagePlus,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { imagesApi, lookupApi, productsApi, fetchApi } from "@/lib/api";
import {
  LookupProductAttribute,
  LookupProductAttributeValue,
} from "@/lib/types";

// --- TYPES ---
type ProductImage = {
  id: number;
  productId: number;
  imageId: number;
  sortOrder: number;
  image: {
    id: number;
    title: string;
    altText: string;
    caption: string;
    url: string;
    width: number;
    height: number;
    fileExtension: string;
    sizeInBytes: number;
  };
};
type ProductTag = { id: number; name: string; slug: string; isActive: boolean };
type AttributeValue = {
  id: number;
  productAttributeId: number;
  attributeName?: string;
  productAttributeValueId: number;
  attributeValue?: string;
  personalizationText: string | null;
};
type AttributeCombination = {
  id: number;
  productId?: number;
  sku: string;
  price: number;
  quantity: number;
  attributeValues: AttributeValue[];
};
type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  discountPrice: number;
  effectivePrice: number;
  isPublished: boolean;
  quantity: number;
  inStock: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCardType: string;
  brand: string;
  gtin: string;
  mpn: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  isDeleted: boolean;
  categoryId: number;
  categoryName: string;
  productImages: ProductImage[];
  productTags: ProductTag[];
  attributeCombinations: AttributeCombination[];
  seoFriendlyUrl: string;
};
type TabType = "basics" | "seo" | "images" | "attributes" | "preview";
type Category = { id: number; name: string };
type UploadedImage = {
  id: number;
  file?: File;
  url: string;
  sortOrder: number;
  title: string;
  altText: string;
  caption: string;
  fileName: string;
  uploading?: boolean;
  uploadError?: string;
};
type CrossSellRecommendationType =
  | "frequentlyBoughtTogether"
  | "similarProducts"
  | "freeShippingCompleter";
type RelatedProductSelection = {
  id: number;
  name: string;
  recommendationType: CrossSellRecommendationType;
  showOnProductPage: boolean;
  showInCart: boolean;
  sortOrder: number;
};
type CrossSellSettingResponse = {
  relatedProductId: number;
  recommendationType: number;
  showOnProductPage: boolean;
  showInCart: boolean;
  sortOrder: number;
};

const crossSellTypeLabels: Record<CrossSellRecommendationType, string> = {
  frequentlyBoughtTogether: "Birlikte al",
  similarProducts: "Benzer ürün",
  freeShippingCompleter: "Kargo ücretsiz tamamla",
};
const toCrossSellType = (value: number): CrossSellRecommendationType =>
  value === 1
    ? "similarProducts"
    : value === 2
      ? "freeShippingCompleter"
      : "frequentlyBoughtTogether";
const toCrossSellTypeValue = (value: CrossSellRecommendationType) =>
  value === "similarProducts" ? 1 : value === "freeShippingCompleter" ? 2 : 0;
// --- END TYPES ---

const STATIC_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!STATIC_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL tanımlı değil.");

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params); // ✅ `params` artık Promise olduğu için çözümledik
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<TabType>("basics");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [mainImageId, setMainImageId] = useState<number | null>(null);

  // --- Attribute States ---
  const [productAttributes, setProductAttributes] = useState<
    LookupProductAttribute[]
  >([]);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, LookupProductAttributeValue[]>
  >({});
  const [attributeCombinations, setAttributeCombinations] = useState<
    AttributeCombination[]
  >([]);

  // Related products
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedResults, setRelatedResults] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedRelated, setSelectedRelated] = useState<
    RelatedProductSelection[]
  >([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    shortDescription: "",
    description: "",
    basePrice: 0,
    discountPrice: 0,
    quantity: 0,
    isPublished: true,
    categoryId: 1,
    brand: "",
    gtin: "",
    mpn: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCardType: "",
  });

  // --- Image Management Functions ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file, index) => {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const autoTitle = fileName
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const tempId = Date.now() + index;
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: UploadedImage = {
          id: tempId,
          file,
          url: reader.result as string,
          sortOrder: images.length + index,
          title: autoTitle,
          altText: autoTitle,
          caption: autoTitle,
          fileName: file.name,
          uploading: true,
        };
        setImages((prev) => [...prev, newImage]);
        uploadImageToApi(file, tempId, autoTitle);
      };
      reader.readAsDataURL(file);
    });
  };
  const uploadImageToApi = async (
    file: File,
    tempId: number,
    autoTitle: string,
  ) => {
    try {
      const response = await imagesApi.uploadImage(
        file,
        autoTitle,
        autoTitle,
        autoTitle,
      );
      if (response.success && response.data) {
        const fullImageUrl = response.data.url.startsWith("http")
          ? response.data.url
          : `${STATIC_BASE_URL}${response.data.url}`;
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? {
                  ...img,
                  id: response.data!.id,
                  title: response.data!.title,
                  altText: response.data!.altText,
                  caption: response.data!.caption,
                  fileName: response.data!.fileName,
                  uploading: false,
                  url: fullImageUrl,
                  file: undefined,
                }
              : img,
          ),
        );
        setMainImageId((prevMainId) =>
          prevMainId === null ? response.data!.id : prevMainId,
        );
      } else {
        throw new Error(response.message || "Resim yükleme başarısız");
      }
    } catch (error) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId
            ? {
                ...img,
                uploading: false,
                uploadError:
                  error instanceof Error
                    ? error.message
                    : "Resim yükleme hatası",
              }
            : img,
        ),
      );
      alert(
        `Resim yükleme hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      );
    }
  };
  const removeImage = (idToRemove: number) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== idToRemove);
      if (mainImageId === idToRemove) {
        setMainImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered.map((img, i) => ({ ...img, sortOrder: i }));
    });
  };
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages.map((img, i) => ({ ...img, sortOrder: i }));
    });
  };
  const updateImageInfo = (
    id: number,
    field: "title" | "altText" | "caption",
    value: string,
  ) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)),
    );
  };

  // --- Attribute Management Functions ---
  const addAttributeCombination = () => {
    setAttributeCombinations((prev) => [
      ...prev,
      {
        id: 0,
        sku: `${formData.sku || "SKU"}-${prev.length + 1}`,
        price: formData.basePrice,
        quantity: formData.quantity,
        attributeValues: [],
      },
    ]);
  };
  const removeAttributeCombination = (index: number) => {
    setAttributeCombinations((prev) => prev.filter((_, i) => i !== index));
  };
  const updateCombinationField = (
    index: number,
    field: "sku" | "price" | "quantity",
    value: string | number,
  ) => {
    setAttributeCombinations((prev) =>
      prev.map((comb, i) => (i === index ? { ...comb, [field]: value } : comb)),
    );
  };
  const addAttributeValueToCombination = (combinationIndex: number) => {
    setAttributeCombinations((prev) =>
      prev.map((combination, i) =>
        i === combinationIndex
          ? {
              ...combination,
              attributeValues: [
                ...combination.attributeValues,
                {
                  id: 0,
                  productAttributeId: 0,
                  productAttributeValueId: 0,
                  personalizationText: null,
                },
              ],
            }
          : combination,
      ),
    );
  };
  const removeAttributeValueFromCombination = (
    combinationIndex: number,
    valueIndex: number,
  ) => {
    setAttributeCombinations((prev) =>
      prev.map((combination, i) =>
        i === combinationIndex
          ? {
              ...combination,
              attributeValues: combination.attributeValues.filter(
                (_, vi) => vi !== valueIndex,
              ),
            }
          : combination,
      ),
    );
  };
  const updateAttributeInCombination = async (
    combinationIndex: number,
    valueIndex: number,
    field: "productAttributeId" | "productAttributeValueId",
    value: number,
  ) => {
    setAttributeCombinations((prev) => {
      const updatedCombinations = [...prev];
      const targetCombination = updatedCombinations[combinationIndex];
      if (targetCombination && targetCombination.attributeValues[valueIndex]) {
        if (field === "productAttributeId") {
          targetCombination.attributeValues[valueIndex] = {
            ...targetCombination.attributeValues[valueIndex],
            productAttributeId: value,
            productAttributeValueId: 0,
          };
        } else {
          targetCombination.attributeValues[valueIndex][field] = value;
        }
      }
      return updatedCombinations;
    });
    if (field === "productAttributeId" && value > 0) {
      await loadAttributeValues(value);
    }
  };

  // --- DÜZELTİLMİŞ FONKSİYON ---
  // Sorunun ana kaynağı buradaydı. `attributeValues` state'i `Record<string, ...>`
  // olarak tanımlanmışken, anahtar olarak `number` tipi kullanılıyordu.
  // Bu durum, React'in state güncellemelerinde tutarsızlığa yol açıyordu.
  // Çözüm, anahtarı her zaman `string` olarak kullanmaktır.
  const loadAttributeValues = async (attributeId: number) => {
    // Geçersiz bir ID gelirse fonksiyonu erken sonlandır.
    if (!attributeId || attributeId === 0) return [];

    // State anahtarı olarak kullanmak için ID'yi string'e çevir.
    const attributeIdStr = attributeId.toString();

    try {
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
      alert(
        `Attribute değerleri yüklenirken hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      );
      return [];
    }
  };

  // --- Data Fetching & Submission ---
  useEffect(() => {
    const loadData = async () => {
      setFetchLoading(true);
      try {
        await Promise.all([
          (async () => {
            try {
              const res = await lookupApi.getCategories();
              if (res.success && res.data) setCategories(res.data);
            } catch (e) {
              setCategories([{ id: 1, name: "Genel" }]);
            } finally {
              setCategoriesLoading(false);
            }
          })(),
          (async () => {
            try {
              const res = await lookupApi.getProductAttributes();
              if (res.success && res.data) {
                // Map response to match LookupProductAttribute type
                setProductAttributes(
                  (res.data as LookupProductAttribute[]).map((attr) => ({
                    id: attr.id,
                    name: attr.name,
                    isPersonalizationText: attr.isPersonalizationText ?? false,
                    productAttributeValues: attr.productAttributeValues ?? [],
                    textPrompt: attr.textPrompt,
                    maxLength: attr.maxLength,
                  })),
                );
              }
            } catch (e) {
            }
          })(),
        ]);

        const response = await productsApi.getProductById(id);
        if (!response.success) throw new Error("Ürün getirilemedi");
        const result = response.data;

        if (response.success && response.data) {
          const productData: Product = result as Product;
          setProduct(productData);
          setFormData({
            name: productData.name,
            slug: productData.slug,
            sku: productData.sku,
            shortDescription: productData.shortDescription,
            description: productData.description,
            basePrice: productData.basePrice,
            discountPrice: productData.discountPrice,
            quantity: productData.quantity,
            isPublished: productData.isPublished,
            categoryId: productData.categoryId,
            brand: productData.brand,
            gtin: productData.gtin,
            mpn: productData.mpn,
            metaTitle: productData.metaTitle,
            metaDescription: productData.metaDescription,
            metaKeywords: productData.metaKeywords,
            canonicalUrl: productData.canonicalUrl,
            ogTitle: productData.ogTitle,
            ogDescription: productData.ogDescription,
            ogImage: productData.ogImage,
            twitterCardType: productData.twitterCardType,
          });
          if (
            productData.productImages &&
            productData.productImages.length > 0
          ) {
            const sortedImages = [...productData.productImages].sort(
              (a, b) => a.sortOrder - b.sortOrder,
            );
            const existingImages = sortedImages.map((pi: ProductImage) => ({
              id: pi.image.id,
              url: pi.image.url.startsWith("http")
                ? pi.image.url
                : `${STATIC_BASE_URL}${pi.image.url}`,
              sortOrder: pi.sortOrder,
              title: pi.image.title,
              altText: pi.image.altText,
              caption: pi.image.caption,
              fileName: `${pi.image.title}.${pi.image.fileExtension}`,
              uploading: false,
            }));
            setImages(existingImages);
            const mainImage =
              sortedImages.find((p) => p.sortOrder === 0) || sortedImages[0];
            setMainImageId(mainImage?.image.id ?? null);
          }
          if (
            productData.attributeCombinations &&
            productData.attributeCombinations.length > 0
          ) {
            setAttributeCombinations(productData.attributeCombinations);
            const attributeIdsToLoad = new Set<number>();
            productData.attributeCombinations.forEach((comb) => {
              comb.attributeValues.forEach((val) => {
                attributeIdsToLoad.add(val.productAttributeId);
              });
            });
            await Promise.all(
              Array.from(attributeIdsToLoad).map((id) =>
                loadAttributeValues(id),
              ),
            );
          }
          // Mevcut ilgili ürünleri ve çapraz satış sunum ayarlarını yükle.
          try {
            const [relJson, settingJson] = await Promise.all([
              fetchApi<{ data?: Array<{ id: number; name: string }> }>(
                `/Product/${id}/related?count=4`,
              ),
              fetchApi<CrossSellSettingResponse[]>(
                `/admin/AdminProduct/${id}/cross-sell-settings`,
              ),
            ]);
            if (relJson?.data && Array.isArray(relJson.data)) {
              const settings = Array.isArray(settingJson) ? settingJson : [];
              setSelectedRelated(
                relJson.data
                  .map((x: { id: number; name: string }, index) => {
                    const setting = settings.find(
                      (item) => item.relatedProductId === x.id,
                    );
                    return {
                      id: x.id,
                      name: x.name,
                      recommendationType: toCrossSellType(
                        setting?.recommendationType ?? 0,
                      ),
                      showOnProductPage: setting?.showOnProductPage ?? true,
                      showInCart: setting?.showInCart ?? true,
                      sortOrder: setting?.sortOrder ?? index,
                    };
                  })
                  .sort((a, b) => a.sortOrder - b.sortOrder),
              );
            }
          } catch {}
        }
      } catch (error) {
      } finally {
        setFetchLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Price") || name === "quantity" ? Number(value) : value,
    }));
  };
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "categoryId" ? Number(value) : value,
    }));
  };

  // --- DÜZELTİLMİŞ FONKSİYON ---
  // API'ye gönderilecek veriyi, backend'in beklediği 'values' anahtarı ile doğru formatta hazırlıyoruz.
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Ana resmin her zaman listenin başında (sortOrder: 0) olmasını sağla.
      const reorderedImages = [...images];
      const mainImageIndex = reorderedImages.findIndex(
        (img) => img.id === mainImageId,
      );

      // Eğer bir ana resim seçilmişse ve bu resim zaten en başta değilse,
      // onu bulup listenin başına taşı.
      if (mainImageIndex > 0) {
        const [mainImage] = reorderedImages.splice(mainImageIndex, 1);
        reorderedImages.unshift(mainImage);
      }

      // 2. Yeniden sıralanmış listeye göre `sortOrder` değerlerini ata.
      const imagesPayload = reorderedImages.map((img, index) => ({
        imageId: img.id,
        sortOrder: index, // index, doğal olarak 0, 1, 2, ... diye gidecek.
      }));
      // 1. Attribute Combinations için backend'in beklediği formatta (payload) hazırlıyoruz.
      const combinationsPayload = attributeCombinations.map((comb) => ({
        // Mevcut kombinasyonun ID'si, güncelleme için önemlidir.
        // Yeni eklenmiş bir kombinasyon ise ID'si 0 olabilir.
        id: comb.id,

        // Paylaştığınız örnekte olduğu gibi productId'yi ekliyoruz.
        productId: Number(id),

        sku: comb.sku,
        price: comb.price,
        quantity: comb.quantity,

        // --- DÜZELTİLDİ: 'attributeValues' anahtarı 'values' olarak değiştirildi ---
        values: comb.attributeValues.map((val) => ({
          productAttributeId: val.productAttributeId,
          productAttributeValueId: val.productAttributeValueId,
          // Eğer backend bu alanı bekliyorsa, bunu da göndermek faydalı olabilir.
          personalizationText: val.personalizationText,
        })),
      }));

      // 2. Güncelleme için gönderilecek ana veriyi hazırlıyoruz.
      const updateData = {
        ...formData,
        id: Number(id),
        productImages: imagesPayload, // Yeniden düzenlenmiş resim listesini kullan
        // 3. Hazırladığımız temiz kombinasyon payload'unu buraya koyuyoruz.
        attributeCombinations: combinationsPayload,
        relatedProductIds: selectedRelated.slice(0, 4).map((x) => x.id),
      };

      // 4. API isteğini gönderiyoruz.
      // const response = await fetch(`${API_BASE_URL}/admin/AdminProduct/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updateData),
      // });
      const response = await productsApi.updateProduct(id, updateData);

      if (!response.success) {
        throw new Error(response.message || "Ürün güncelleme başarısız");
      }

      // Ana ürün güncellemesi ilişkileri yeniden oluşturur. Bu yüzden tür, görünürlük ve
      // sıralama ayarlarını ilişkiler oluştuktan sonra ayrıca kaydediyoruz.
      await fetchApi(`/admin/AdminProduct/${id}/cross-sell-settings`, {
        method: "PUT",
        body: JSON.stringify(
          selectedRelated.slice(0, 4).map((related, index) => ({
            relatedProductId: related.id,
            recommendationType: toCrossSellTypeValue(
              related.recommendationType,
            ),
            showOnProductPage: related.showOnProductPage,
            showInCart: related.showInCart,
            sortOrder: index,
          })),
        ),
      });

      if (response.success) {
        alert("Ürün başarıyla güncellendi!");
        router.push("/products");
      } else {
        throw new Error(
          response.message || "Güncelleme sunucu tarafında başarısız oldu",
        );
      }
    } catch (error) {
      alert(
        `Güncelleme sırasında bir hata oluştu: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await productsApi.deleteProduct(parseInt(id)); // api.ts’den çağırıyoruz
      alert("Ürün başarıyla silindi!");
      router.push("/products");
    } catch (error) {
      alert("Silme sırasında bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "basics", label: "Temel Bilgiler" },
    { id: "seo", label: "SEO & Meta" },
    { id: "images", label: "Ürün Resimleri" },
    { id: "attributes", label: "Özellikler" },
    { id: "preview", label: "Önizleme & Kaydet" },
  ];
  const canProceed = () => {
    switch (currentTab) {
      case "basics":
        return formData.name && formData.sku && formData.basePrice > 0;
      default:
        return true;
    }
  };

  // --- RENDER FUNCTION ---
  const renderTabContent = () => {
    if (fetchLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Yükleniyor...
        </div>
      );
    }

    switch (currentTab) {
      case "basics":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ürün Adı *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="border-palette-lightBlue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="border-palette-lightBlue"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="border-palette-lightBlue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori</Label>
                <Select
                  value={formData.categoryId.toString()}
                  onValueChange={(value) =>
                    handleSelectChange("categoryId", value)
                  }
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className="border-palette-lightBlue">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Kategoriler yükleniyor..."
                          : "Kategori seçin"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Kısa Açıklama</Label>
              <div className="min-h-[150px] border rounded-md border-input">
                <RichTextEditor
                  value={formData.shortDescription || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescription: value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detaylı Açıklama</Label>
              <div className="min-h-[300px] border rounded-md border-input">
                <RichTextEditor
                  value={formData.description || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, description: value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Taban Fiyat *</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  required
                  className="border-palette-lightBlue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPrice">İndirimli Fiyat</Label>
                <Input
                  id="discountPrice"
                  name="discountPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountPrice}
                  onChange={handleInputChange}
                  className="border-palette-lightBlue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Stok Miktarı</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="border-palette-lightBlue"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marka</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="border-palette-lightBlue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gtin">GTIN</Label>
                <Input
                  id="gtin"
                  name="gtin"
                  value={formData.gtin}
                  onChange={handleInputChange}
                  className="border-palette-lightBlue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mpn">MPN</Label>
                <Input
                  id="mpn"
                  name="mpn"
                  value={formData.mpn}
                  onChange={handleInputChange}
                  className="border-palette-lightBlue"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  handleSwitchChange("isPublished", checked)
                }
              />
              <Label htmlFor="isPublished">Yayında</Label>
            </div>
          </div>
        );
      case "seo":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Başlık</Label>
              <Input
                id="metaTitle"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleInputChange}
                className="border-palette-lightBlue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Açıklama</Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                className="min-h-[80px] border-palette-lightBlue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaKeywords">Meta Anahtar Kelimeler</Label>
              <Input
                id="metaKeywords"
                name="metaKeywords"
                value={formData.metaKeywords}
                onChange={handleInputChange}
                className="border-palette-lightBlue"
                placeholder="kelime1, kelime2, kelime3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                name="canonicalUrl"
                value={formData.canonicalUrl}
                onChange={handleInputChange}
                className="border-palette-lightBlue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogTitle">Open Graph Başlık</Label>
              <Input
                id="ogTitle"
                name="ogTitle"
                value={formData.ogTitle}
                onChange={handleInputChange}
                className="border-palette-lightBlue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogDescription">Open Graph Açıklama</Label>
              <Textarea
                id="ogDescription"
                name="ogDescription"
                value={formData.ogDescription}
                onChange={handleInputChange}
                className="min-h-[80px] border-palette-lightBlue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitterCardType">Twitter Card Tipi</Label>
              <Select
                value={formData.twitterCardType}
                onValueChange={(value) =>
                  handleSelectChange("twitterCardType", value)
                }
              >
                <SelectTrigger className="border-palette-lightBlue">
                  <SelectValue placeholder="Twitter card tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="summary_large_image">
                    Summary Large Image
                  </SelectItem>
                  <SelectItem value="app">App</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
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
                        const res = await productsApi.getProducts({
                          page: 1,
                          pageSize: 10,
                          search: term,
                        });
                        const items = (res.items ?? []).map(
                          (x: import("@/lib/types").ProductListItemNew) => ({
                            id: x.id,
                            name: x.name,
                          }),
                        );
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
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{r.name}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (selectedRelated.find((x) => x.id === r.id))
                            return;
                          if (selectedRelated.length >= 4) return;
                          setSelectedRelated((prev) => [
                            ...prev,
                            {
                              ...r,
                              recommendationType: "frequentlyBoughtTogether",
                              showOnProductPage: true,
                              showInCart: true,
                              sortOrder: prev.length,
                            },
                          ]);
                        }}
                        disabled={
                          selectedRelated.length >= 4 ||
                          selectedRelated.some((x) => x.id === r.id)
                        }
                      >
                        Ekle
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {selectedRelated.length > 0 && (
                <div className="space-y-3">
                  {selectedRelated.map((r, index) => (
                    <div
                      key={r.id}
                      className="rounded-md border bg-neutral-50 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">
                          {index + 1}. {r.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={index === 0}
                            onClick={() =>
                              setSelectedRelated((prev) => {
                                const items = [...prev];
                                [items[index - 1], items[index]] = [
                                  items[index],
                                  items[index - 1],
                                ];
                                return items.map((item, position) => ({
                                  ...item,
                                  sortOrder: position,
                                }));
                              })
                            }
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={index === selectedRelated.length - 1}
                            onClick={() =>
                              setSelectedRelated((prev) => {
                                const items = [...prev];
                                [items[index], items[index + 1]] = [
                                  items[index + 1],
                                  items[index],
                                ];
                                return items.map((item, position) => ({
                                  ...item,
                                  sortOrder: position,
                                }));
                              })
                            }
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setSelectedRelated((prev) =>
                                prev
                                  .filter((x) => x.id !== r.id)
                                  .map((item, position) => ({
                                    ...item,
                                    sortOrder: position,
                                  })),
                              )
                            }
                          >
                            Kaldır
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3 md:items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Öneri türü</Label>
                          <Select
                            value={r.recommendationType}
                            onValueChange={(
                              value: CrossSellRecommendationType,
                            ) =>
                              setSelectedRelated((prev) =>
                                prev.map((item) =>
                                  item.id === r.id
                                    ? { ...item, recommendationType: value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(crossSellTypeLabels).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pb-2">
                          <Switch
                            id={`product-page-${r.id}`}
                            checked={r.showOnProductPage}
                            onCheckedChange={(checked) =>
                              setSelectedRelated((prev) =>
                                prev.map((item) =>
                                  item.id === r.id
                                    ? { ...item, showOnProductPage: checked }
                                    : item,
                                ),
                              )
                            }
                          />
                          <Label
                            htmlFor={`product-page-${r.id}`}
                            className="text-sm"
                          >
                            Ürün sayfasında göster
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 pb-2">
                          <Switch
                            id={`cart-${r.id}`}
                            checked={r.showInCart}
                            onCheckedChange={(checked) =>
                              setSelectedRelated((prev) =>
                                prev.map((item) =>
                                  item.id === r.id
                                    ? { ...item, showInCart: checked }
                                    : item,
                                ),
                              )
                            }
                          />
                          <Label htmlFor={`cart-${r.id}`} className="text-sm">
                            Sepette göster
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "images":
        return (
          <div className="space-y-6">
            <div>
              <Label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">
                      Yüklemek için tıklayın
                    </span>{" "}
                    veya sürükleyip bırakın
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP (MAX. 800x400px)
                  </p>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleImageUpload}
                />
              </Label>
            </div>
            {images.length > 0 && (
              <RadioGroup
                value={mainImageId?.toString()}
                onValueChange={(val) => setMainImageId(Number(val))}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <Card
                      key={img.id}
                      className="p-3 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                          {img.uploading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : img.uploadError ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 text-xs text-center p-1">
                              {img.uploadError}
                            </div>
                          ) : (
                            <Image
                              src={img.url}
                              alt={img.altText}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={img.id.toString()}
                              id={`r-${img.id}`}
                            />
                            <Label
                              htmlFor={`r-${img.id}`}
                              className="font-medium text-sm"
                            >
                              Ana Resim
                            </Label>
                          </div>
                          <div
                            className="text-xs text-gray-500 truncate"
                            title={img.fileName}
                          >
                            {img.fileName}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => removeImage(img.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => moveImage(index, index - 1)}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === images.length - 1}
                            onClick={() => moveImage(index, index + 1)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label
                            htmlFor={`title-${img.id}`}
                            className="text-xs"
                          >
                            Title
                          </Label>
                          <Input
                            id={`title-${img.id}`}
                            value={img.title}
                            onChange={(e) =>
                              updateImageInfo(img.id, "title", e.target.value)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`alt-${img.id}`} className="text-xs">
                            Alt Text
                          </Label>
                          <Input
                            id={`alt-${img.id}`}
                            value={img.altText}
                            onChange={(e) =>
                              updateImageInfo(img.id, "altText", e.target.value)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            )}
            {images.length === 0 && !fetchLoading && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                Henüz ürün resmi eklenmedi.
              </div>
            )}
          </div>
        );
      case "attributes":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {attributeCombinations.map((combination, combIndex) => (
                <Card
                  key={`comb-${combIndex}-${combination.id}`}
                  className="bg-gray-50/50"
                >
                  <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                    <CardTitle className="text-base font-semibold">
                      Varyasyon #{combIndex + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeAttributeCombination(combIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor={`sku-${combIndex}`}>
                          Varyasyon SKU
                        </Label>
                        <Input
                          id={`sku-${combIndex}`}
                          value={combination.sku}
                          onChange={(e) =>
                            updateCombinationField(
                              combIndex,
                              "sku",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`price-${combIndex}`}>Fiyat</Label>
                        <Input
                          id={`price-${combIndex}`}
                          type="number"
                          value={combination.price}
                          onChange={(e) =>
                            updateCombinationField(
                              combIndex,
                              "price",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`qty-${combIndex}`}>Stok Miktarı</Label>
                        <Input
                          id={`qty-${combIndex}`}
                          type="number"
                          value={combination.quantity}
                          onChange={(e) =>
                            updateCombinationField(
                              combIndex,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Özellikler</Label>
                      {combination.attributeValues.map(
                        (attrValue, valIndex) => {
                          // --- OKUNABİLİRLİK İÇİN İYİLEŞTİRME ---
                          // İlgili attribute'e ait değerleri state'ten alıyoruz.
                          // Anahtar olarak tutarlı bir şekilde string kullanıyoruz.
                          const attributeIdStr =
                            attrValue.productAttributeId?.toString();
                          const availableValues = attributeIdStr
                            ? attributeValues[attributeIdStr] || []
                            : [];
                          const isValueSelectDisabled =
                            !attrValue.productAttributeId ||
                            !attributeValues[attributeIdStr];

                          return (
                            <div
                              key={`attr-${combIndex}-${valIndex}`}
                              className="grid grid-cols-11 gap-2 items-center"
                            >
                              <div className="col-span-5">
                                <Select
                                  value={attrValue.productAttributeId.toString()}
                                  onValueChange={(val) =>
                                    updateAttributeInCombination(
                                      combIndex,
                                      valIndex,
                                      "productAttributeId",
                                      Number(val),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Özellik Seçin..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productAttributes.map((attr) => (
                                      <SelectItem
                                        key={attr.id}
                                        value={attr.id.toString()}
                                      >
                                        {attr.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-5">
                                <Select
                                  value={
                                    attrValue.productAttributeValueId
                                      ? attrValue.productAttributeValueId.toString()
                                      : ""
                                  }
                                  disabled={isValueSelectDisabled}
                                  onValueChange={(val) =>
                                    updateAttributeInCombination(
                                      combIndex,
                                      valIndex,
                                      "productAttributeValueId",
                                      Number(val),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        isValueSelectDisabled
                                          ? "Önce özellik seçin"
                                          : "Değer Seçin..."
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableValues.map((val) => (
                                      <SelectItem
                                        key={val.id}
                                        value={val.id.toString()}
                                      >
                                        {val.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() =>
                                    removeAttributeValueFromCombination(
                                      combIndex,
                                      valIndex,
                                    )
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        },
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          addAttributeValueToCombination(combIndex)
                        }
                      >
                        + Özellik Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Button onClick={addAttributeCombination}>
                + Yeni Varyasyon Ekle
              </Button>
            </div>
          </div>
        );
      case "preview":
        const mainImage = images.find((img) => img.id === mainImageId);
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 text-palette-blue">
                  Ürün Bilgileri
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground font-medium">
                      Ürün Adı
                    </dt>
                    <dd className="text-base">{formData.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground font-medium">
                      SKU
                    </dt>
                    <dd className="text-base">{formData.sku}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground font-medium">
                      Kategori
                    </dt>
                    <dd className="text-base">
                      {
                        categories.find((c) => c.id === formData.categoryId)
                          ?.name
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground font-medium">
                      Taban Fiyat
                    </dt>
                    <dd className="text-base">₺{formData.basePrice}</dd>
                  </div>
                  {formData.discountPrice > 0 && (
                    <div>
                      <dt className="text-sm text-muted-foreground font-medium">
                        İndirimli Fiyat
                      </dt>
                      <dd className="text-base text-red-600">
                        ₺{formData.discountPrice}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground font-medium">
                      Stok
                    </dt>
                    <dd className="text-base">{formData.quantity} adet</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground font-medium">
                      Durum
                    </dt>
                    <dd className="text-base">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-sm",
                          formData.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800",
                        )}
                      >
                        {formData.isPublished ? "Yayında" : "Taslak"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-palette-blue">
                  Ürün Resimleri
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {mainImage && (
                    <div className="col-span-2 border rounded-lg overflow-hidden relative aspect-video">
                      <Image
                        src={mainImage.url}
                        alt={mainImage.altText}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute top-2 left-2 bg-palette-blue text-black text-xs px-2 py-1 rounded">
                        Ana Resim
                      </div>
                    </div>
                  )}
                  {images
                    .filter((img) => img.id !== mainImageId)
                    .slice(0, 4)
                    .map((img) => (
                      <div
                        key={img.id}
                        className="border rounded-lg overflow-hidden relative aspect-square"
                      >
                        <Image
                          src={img.url}
                          alt={img.altText}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    ))}
                </div>
                {images.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    Resim bulunmuyor
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Ürün Düzenle</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading}>
              Ürünü Sil
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Siliniyor..." : "Sil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-6">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={cn(
              "p-3 text-sm text-center rounded-lg transition-colors",
              currentTab === tab.id
                ? "bg-palette-blue text-black"
                : "bg-palette-lightBlue/20 text-palette-blue hover:bg-palette-lightBlue/30",
              index < tabs.findIndex((t) => t.id === currentTab) &&
                "bg-green-500 text-white",
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
              const currentIndex = tabs.findIndex((t) => t.id === currentTab);
              if (currentIndex > 0) {
                setCurrentTab(tabs[currentIndex - 1].id);
              }
            }}
            disabled={currentTab === "basics" || loading || fetchLoading}
            className="border-palette-lightBlue hover:bg-palette-lightBlue/20"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Önceki
          </Button>

          {currentTab === "preview" ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || fetchLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Kaydediliyor...
                </>
              ) : (
                "Değişiklikleri Kaydet"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const currentIndex = tabs.findIndex((t) => t.id === currentTab);
                if (currentIndex < tabs.length - 1) {
                  setCurrentTab(tabs[currentIndex + 1].id);
                }
              }}
              disabled={!canProceed() || loading || fetchLoading}
              className="bg-palette-blue hover:bg-palette-lightBlue"
            >
              Sonraki
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
