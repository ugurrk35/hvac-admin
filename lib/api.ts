"use client"
import { ImageUploadResponse } from "@/app/interface/image";
import type {
  CreateCategoryPayload,
  CategoryResponse,
  CategoriesListResponse,
  CreateProductAttributePayload,
  ProductAttributeResponse,
  ProductAttribute,
  UpdateCategoryPayload,
  DashboardStatsResponse,
  DashboardStats,
  RecentOrdersResponse,
  TopProductsResponse,
  SalesChartResponse,
  TopCategoriesResponse,
  OrderStatusDistributionResponse,
  RevenueResponse,
  AdminUserDetail,
  PagedUsersResponse,
  UpdateUserPayload,
  ChangeOwnPasswordPayload,
  ChangeOwnEmailPayload,
  UsersQuery,
  DataResponse,
  BaseResponse,
  UserStatisticsDto,
  Product,
  Order,
  BlogCategory,
  BlogCategoryDetail,
  BlogCategoryList,
  CreateBlogPostNewDto,
  BlogPost,
  BlogPostDetail,
  CreateProductPayloadNew,
  ProductsResponse,
  ShoppingCartType,
  ShoppingCartTypeDtails,
  OrderEdit,
  OrderTimelineItem,
  OrderNote,
  OrderListSummary,
  AdminReviewListItem,
  AdminQuestionListItem,
  MarketingSettings,
} from "@/lib/types"
import { LookupProductAttributeValue } from "@/app/interface/lookup";
import { ApiResponse, PagedResponse } from "@/app/interface/response";

type HttpError = Error & { status?: number };

function getApiUrl(endpoint: string): string {
  return `/api/backend${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const mergedHeaders = new Headers(options.headers || {})
  mergedHeaders.set("Accept", "application/json")
  mergedHeaders.set("Content-Type", "application/json")
  
  const url = getApiUrl(endpoint)

  try {
    const response = await fetch(url, { ...options, headers: mergedHeaders, credentials: "same-origin" })
    const contentType = response.headers.get("content-type")

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        throw new Error('Yetkilendirme hatası')
      }

      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData: { message?: string } = await response.json()
          errorMessage = errorData?.message || errorMessage
        } else {
          errorMessage = await response.text()
        }
      } catch {}
      (function(){ const err2 = new Error(errorMessage) as HttpError; err2.status = response.status; throw err2; })()
    }

    if (!contentType || !contentType.includes("application/json")) {
      return {} as T
    }

    return response.json()
  } catch (error) {
    throw error
  }
}

// Same as fetchApi but does NOT remove token or redirect on 401.
export async function fetchApiNoAutoLogout<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const mergedHeaders = new Headers(options.headers || {})
  mergedHeaders.set("Accept", "application/json")
  mergedHeaders.set("Content-Type", "application/json")

  const url = getApiUrl(endpoint)
  try {
    const response = await fetch(url, { ...options, headers: mergedHeaders, credentials: "same-origin" })
    const contentType = response.headers.get("content-type")

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData: { message?: string } = await response.json()
          errorMessage = errorData?.message || errorMessage
        } else {
          errorMessage = await response.text()
        }
      } catch {}
      const err2 = new Error(errorMessage) as HttpError
      err2.status = response.status
      throw err2
    }

    if (!contentType || !contentType.includes("application/json")) {
      return {} as T
    }
    return response.json()
  } catch (error) {
    throw error
  }
}

// Multipart form data için güncellenmiş fonksiyon
export async function fetchMultipartApi<T>(endpoint: string, formData: FormData): Promise<T> {
  const mergedHeaders = new Headers()
  mergedHeaders.set("Accept", "application/json")

  const url = getApiUrl(endpoint)

  try {
    const response = await fetch(url, { 
      method: "POST", 
      headers: mergedHeaders, 
      body: formData,
      credentials: "same-origin",
    })

    if (response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      throw new Error('Yetkilendirme hatası')
    }

    const contentType = response.headers.get("content-type")
    
    if (!contentType || !contentType.includes("application/json")) {
      await response.text()
      throw new Error("API yanıtı JSON formatında değil")
    }

    if (!response.ok) {
      const errorData: { message?: string } | null = await response.json().catch(() => null)
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    throw error
  }
}

// Same as fetchApi but does NOT auto-logout/redirect on 401; caller handles.
// fetchApiNoAutoLogout removed to reduce parser differences; use fetchApi

// ===== Marketing (Admin) =====
export type UpdateMarketingSettingsRequest = {
  GTMContainerId: string | null
  GoogleAnalyticsId: string | null
  FacebookPixelId: string | null
  TikTokPixelId: string | null
  MetaConversionApiKey: string | null
  IsGTMEnabled: boolean
  IsGAEnabled: boolean
  IsFacebookEnabled: boolean
  IsTikTokEnabled: boolean
}

export const marketingAdminApi = {
  get: () => fetchApiNoAutoLogout<MarketingSettings>("/admin/marketing/settings"),
  save: (payload: UpdateMarketingSettingsRequest) =>
    fetchApiNoAutoLogout<MarketingSettings>("/admin/marketing/settings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}
// ---- Blog Kategorileri ----


// Blog Posts API
export const blogPostsApi = {
  create: async (dto: CreateBlogPostNewDto) => {
    const res = await fetchApi<{ data: Record<string, unknown>; success: boolean }>("/admin/AdminBlog/posts", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    if (!res.success) throw new Error("Blog yazısı kaydedilemedi")
    return res.data
  },
  
   getDetail: async (id: string): Promise<BlogPostDetail> => {
    const res = await fetchApi<{ data: BlogPostDetail; success: boolean }>(`/admin/AdminBlog/blogposts/${id}`)
    if (!res.success) throw new Error("Blog yazısı bulunamadı")

    return res.data
  },
  update: async (id: string | number, dto: CreateBlogPostNewDto) => {
    const res = await fetchApi<{ data: Record<string, unknown>; success: boolean }>(`/admin/AdminBlog/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    })
    if (!res.success) throw new Error("Blog yazısı güncellenemedi")
    return res.data
  },
 search: async (pageNumber: number = 1, pageSize: number = 10): Promise<PagedResponse<BlogPost>> => {
  const url = `/admin/AdminBlog/posts/paged?pageNumber=${pageNumber}&pageSize=${pageSize}`

  const response = await fetchApi<PagedResponse<BlogPost>>(url) // 'any' veya uygun interface

  if (!response.items) {
    throw new Error(response.totalCount === 0 ? "Sonuç bulunamadı" : "Blog yazıları getirilemedi")
  }

  return {
    items: response.items || [],
    totalPages: response.totalPages || 1,
    totalCount: response.totalCount || 0,
    hasPreviousPage: response.hasPreviousPage || false,
    hasNextPage: response.hasNextPage || false
  }
}

}
// ---- Blog kategori Yazıları ----

export const blogCategoriesApi = {
    getLookup: async (): Promise<BlogCategoryList[]> => {
    const res = await fetchApi<{ data: BlogCategoryList[]; success: boolean }>("/Lookup/lookup-blogcategories")
    if (!res.success) throw new Error("Kategoriler yüklenemedi")
    return res.data || []
  },
  createCategory: async (payload: BlogCategory) => {
    const res = await fetchApi<{ data: BlogCategory; success: boolean }>("/admin/AdminBlog/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    if (!res.success) throw new Error("Kategori oluşturulamadı")
    return res.data
  },

  updateCategory: async (id: string | number, payload: BlogCategory) => {
    const res = await fetchApi<{ data: BlogCategory; success: boolean }>(`/admin/AdminBlog/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    if (!res.success) throw new Error("Kategori güncellenemedi")
    return res.data
  },
  getAll: async (): Promise<BlogCategoryList[]> => {
    const res = await fetchApi<ApiResponse<BlogCategoryList[]>>("/admin/AdminBlog/categories")
    if (!res.success) throw new Error(res.message || "Kategoriler yüklenemedi")
    return res.data || []
  },
getById: async (id: string | number): Promise<BlogCategoryDetail> => {
    const res = await fetchApi<{ data: BlogCategoryDetail; success: boolean }>(`/admin/AdminBlog/categories/${id}`)
    if (!res.success) throw new Error("Kategori bulunamadı")
    return res.data
  },
  deleteCategory: async (id: number) => {
    const res = await fetchApi<ApiResponse<null>>(`/Blog/categories/${id}`, {
      method: "DELETE",
    })
    if (!res.success) throw new Error(res.message || "Kategori silinemedi")
    return res.data
  },
}

// Reviews moderation (Admin)
export const reviewsAdminApi = {
  list: async (status?: "pending" | "approved") => {
    const url = status ? `/admin/AdminReviews?status=${status}` : `/admin/AdminReviews`;
    return fetchApi<ApiResponse<AdminReviewListItem[]>>(url);
  },
  approve: async (id: number) => {
    return fetchApi<BaseResponse>(`/admin/AdminReviews/approve/${id}`, { method: "PUT" });
  },
  delete: async (id: number) => {
    return fetchApi<BaseResponse>(`/admin/AdminReviews/${id}`, { method: "DELETE" });
  },
};

export const questionsAdminApi = {
  list: async (status?: "pending" | "approved") => {
    const url = status ? `/admin/AdminQuestions?status=${status}` : `/admin/AdminQuestions`;
    return fetchApi<ApiResponse<AdminQuestionListItem[]>>(url);
  },
  approve: async (id: number) => {
    return fetchApi<BaseResponse>(`/admin/AdminQuestions/approve/${id}`, { method: "PUT" });
  },
  answer: async (id: number, answer: string) => {
    return fetchApi<BaseResponse>(`/admin/AdminQuestions/answer/${id}`, { method: "PUT", body: JSON.stringify(answer) });
  },
};

//siparişler API
export const ordersApi = {
getPagedOrders: async (params: { page: number; pageSize: number; search?: string; status?: number; fromDate?: string; toDate?: string; isArchived?: boolean }) => {
  const searchParams = new URLSearchParams({
    pageNumber: params.page.toString(),
    pageSize: params.pageSize.toString(),
  })
  if (params.search) searchParams.set("search", params.search)
  if (typeof params.status === "number") searchParams.set("status", String(params.status))
  if (params.fromDate) searchParams.set("fromDate", params.fromDate)
  if (params.toDate) searchParams.set("toDate", params.toDate)
  if (params.isArchived) searchParams.set("isArchived", "true")

  return fetchApi<PagedResponse<Order>>(
    `/admin/AdminOrder/paged-orders?${searchParams}`
  )
},
exportOrders: async (params: { search?: string; status?: number; fromDate?: string; toDate?: string; isArchived?: boolean }) => {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set("search", params.search)
  if (typeof params.status === "number") searchParams.set("status", String(params.status))
  if (params.fromDate) searchParams.set("fromDate", params.fromDate)
  if (params.toDate) searchParams.set("toDate", params.toDate)
  if (params.isArchived) searchParams.set("isArchived", "true")
  const response = await fetch(getApiUrl(`/admin/AdminOrder/export?${searchParams}`), { headers: { Accept: "text/csv" }, credentials: "same-origin" })
  if (!response.ok) throw new Error("Sipariş raporu indirilemedi.")
  return response.blob()
},
getSummary: async (params: { search?: string; status?: number; fromDate?: string; toDate?: string; isArchived?: boolean }) => {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set("search", params.search)
  if (typeof params.status === "number") searchParams.set("status", String(params.status))
  if (params.fromDate) searchParams.set("fromDate", params.fromDate)
  if (params.toDate) searchParams.set("toDate", params.toDate)
  if (params.isArchived) searchParams.set("isArchived", "true")
  return fetchApi<ApiResponse<OrderListSummary>>(`/admin/AdminOrder/summary?${searchParams}`)
},
restoreOrder: (id: number) => fetchApi<BaseResponse>(`/admin/AdminOrder/${id}/restore`, { method: "POST" }),
getOrderById: async (id: number) => {
    return fetchApi<ApiResponse<OrderEdit>>(`/admin/AdminOrder/${id}`)
  },
  getTimeline: async (id: number) =>
    fetchApi<ApiResponse<OrderTimelineItem[]>>(`/admin/AdminOrder/${id}/timeline`),
  getNotes: async (id: number) =>
    fetchApi<ApiResponse<OrderNote[]>>(`/admin/AdminOrder/${id}/notes`),
  addNote: async (id: number, note: string) =>
    fetchApi<ApiResponse<OrderNote>>(`/admin/AdminOrder/${id}/notes`, { method: "POST", body: JSON.stringify({ note }) }),


  createOrder: (payload: Record<string, unknown>) => {
    return fetchApi<Record<string, unknown>>("/admin/AdminOrder", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  archiveOrders: (orderIds: number[], reason: string) =>
    fetchApi<BaseResponse>("/admin/AdminOrder/archive", {
      method: "POST",
      body: JSON.stringify({ orderIds, reason }),
    }),
}
// Güncellenmiş products API
export type ProductListQuery = {
  page: number
  pageSize: number
  search?: string
  categoryId?: number
  isPublished?: boolean
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  brand?: string
  sortBy?: "name" | "price" | "date"
  sortOrder?: "asc" | "desc"
}

export const productsApi = {
  duplicateProduct: (id: number) => fetchApi<ApiResponse<{ id?: number }>>(`/admin/AdminProduct/${id}/duplicate`, { method: "POST" }),
  getProducts: async (params: ProductListQuery): Promise<ProductsResponse> => {
  const searchParams = new URLSearchParams({
    pageNumber: params.page.toString(),
    pageSize: params.pageSize.toString(),
    ...(params.search && { searchTerm: params.search }),
    ...(params.categoryId !== undefined && { categoryId: params.categoryId.toString() }),
    ...(params.isPublished !== undefined && { isPublished: params.isPublished.toString() }),
    ...(params.inStock !== undefined && { inStock: params.inStock.toString() }),
    ...(params.minPrice !== undefined && { minPrice: params.minPrice.toString() }),
    ...(params.maxPrice !== undefined && { maxPrice: params.maxPrice.toString() }),
    ...(params.brand && { brand: params.brand }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  })

  return await fetchApi<ProductsResponse>(`/admin/AdminProduct?${searchParams}`)
},
updateProduct: (id: string, payload: Record<string, unknown>) => {
  return fetchApi<ApiResponse<Record<string, unknown>>>(`/admin/AdminProduct/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
},
 createProduct: (payload: CreateProductPayloadNew) => {
    // API'n hangi shape'i döndürüyor bilmiyorsan ApiResponse<Record<string, unknown>> kullanabilirsin
    return fetchApi<ApiResponse<Record<string, unknown>>>("/admin/AdminProduct", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
getProductById(id: string): Promise<ApiResponse<Product>> {
  return fetchApi<ApiResponse<Product>>(`/admin/AdminProduct/${id}`)
},
// ✅ Ürün silme
  deleteProduct: (id: number) => {
    return fetchApi<ApiResponse<BaseResponse>>(`/admin/AdminProduct/${id}`, {
      method: "DELETE",
    })
  },
}
export const shoppingCartApi = {
  getCarts: async (): Promise<ApiResponse<ShoppingCartType>> => {
    try {
      const res = await fetchApi<ApiResponse<ShoppingCartType>>("/admin/AdminShoppingCart");
      return res;
    } catch (err) {
      return {
        success: false,
        message: "Sunucu hatası",
        data: undefined,
      };
    }
  },
  getCartById: async (id: number): Promise<ApiResponse<ShoppingCartTypeDtails>> => {
    try {
      const res = await fetchApi<ApiResponse<ShoppingCartTypeDtails>>(`/admin/AdminShoppingCart/${id}`);
      return res;
    } catch (err) {
      return { success: false, message: "Sunucu hatası", data: undefined };
    }
  },
  deleteCart: async (id: number): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const res = await fetchApi<ApiResponse<Record<string, unknown>>>(`/admin/AdminShoppingCart/${id}`, {
        method: "DELETE",
      });
      return res;
    } catch (err) {
      return {
        success: false,
        message: "Silme işlemi başarısız oldu",
        data: undefined,
      };
    }
  },

};
export async function getProductById(id: string): Promise<ApiResponse<Product>> {
  return fetchApi<ApiResponse<Product>>(`/admin/AdminProduct/${id}`)
}
export async function createProductAttribute(payload: CreateProductAttributePayload) {
  return await fetchApi<ApiResponse<ProductAttributeResponse>>("/admin/AdminProductAttribute", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
export const categoriesApi = {
  getCategories: () => {
    return fetchApi<CategoriesListResponse>("/admin/AdminCategories/active")
  },

  createCategory: (payload: CreateCategoryPayload) => {
    return fetchApi<CategoryResponse>("/admin/AdminCategories", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateCategory: (id: number, payload: UpdateCategoryPayload) => {
      const fullPayload = { ...payload, id } // 👈 ID'yi dahil et
    return fetchApi<CategoryResponse>(`/admin/AdminCategories`, {
      method: "PUT",
      body: JSON.stringify(fullPayload ),
    })
  },

  getCategory: (id: number) => {
    return fetchApi<CategoryResponse>(`/admin/AdminCategories/${id}`)
  },

  deleteCategory: (id: number) => {
    return fetchApi(`/admin/AdminCategories/${id}`, { method: "DELETE" })
  },
}


// ProductAttribute API servisi
export const productAttributeApi = {
  getProductAttributes: async (): Promise<ApiResponse<ProductAttribute[]>> => {
    // API'den veri çekiliyor
    const response = await fetchApi<ApiResponse<ProductAttribute[]>>(
      "/admin/AdminProductAttribute/with-values"
    )
    return response
  },

  getProductAttribute: (id: number) => {
    return fetchApi<ApiResponse<ProductAttribute>>(`/admin/AdminProductAttribute/with-values/${id}`)
  },

  createProductAttribute: (payload: ProductAttribute) => {
    return fetchApi<ApiResponse<ProductAttribute>>("/admin/AdminProductAttribute", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateProductAttribute: (id: number, payload: ProductAttribute) => {
    return fetchApi<ApiResponse<ProductAttribute>>(`/admin/AdminProductAttribute?id=${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },


  deleteProductAttribute: (id: number) => {
    return fetchApi<ApiResponse<ProductAttribute>>(`/admin/AdminProductAttribute/${id}`, { method: "DELETE" })
  },
}


// Yeni Lookup API servisi
export const lookupApi = {
  // Kategorileri listele
  getCategories: () => {
    return fetchApi<ApiResponse<{ id: number; name: string }[]>>("/Lookup/lookup-categories")
  },

  // Product attribute'ları listele
  getProductAttributes: () => {
    return fetchApi<ApiResponse<ProductAttribute[]>>("/Lookup/lookup-product-attributes")
  },

  // Product attribute değerlerini listele
  getProductAttributeValues: (attributeId: number) => {
    return fetchApi<ApiResponse<LookupProductAttributeValue[]>>(
      `/Lookup/lookup-product-attribute-values/${attributeId}`,
    ).catch((error) => {
      // Hata durumunda boş bir başarılı yanıt döndür
      return {
        success: false,
        message: error instanceof Error ? error.message : "Attribute değerleri yüklenemedi",
        data: [],
      }
    })
  },
}



export const imagesApi = {
  // Resim yükleme
  uploadImage: async (file: File, title?: string, altText?: string, caption?: string): Promise<ImageUploadResponse> => {
    // Dosya adından otomatik title, altText, caption oluştur
    const fileName = file.name.replace(/\.[^/.]+$/, "") // Uzantıyı kaldır
    const autoTitle = title || fileName.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    const autoAltText = altText || autoTitle
    const autoCaption = caption || autoTitle

    const formData = new FormData()
    formData.append("File", file)
    formData.append("Title", autoTitle)
    formData.append("AltText", autoAltText)
    formData.append("Caption", autoCaption)

    return fetchMultipartApi<ImageUploadResponse>("/admin/Images/upload", formData)
  },
}
// ProductTag API servisi
export const productTagApi = {
  // Yeni etiket oluştur
  createProductTag: (payload: { name: string; slug: string; isActive: boolean }) => {
    return fetchApi<ApiResponse<{ id: number; name: string; slug: string; isActive: boolean }>>("/ProductTag", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  // Etiket sil
  deleteProductTag: (id: number) => {
    return fetchApi<ApiResponse<{ deleted: boolean }>>(`/ProductTag/${id}`, { method: "DELETE" })
  },
}


// Dashboard API servisi
export const dashboardApi = {
  // Dashboard genel istatistikleri
  getStats: async () => {
    try {
      type RawDashboardStatistics = {
        totalOrders: number
        totalProducts: number
        totalCustomers: number
        totalCategories: number
        totalRevenue: number
        todayRevenue: number
        monthlyRevenue: number
        pendingOrders: number
        processingOrders: number
        completedOrders: number
        cancelledOrders: number
        lowStockProducts: number
        outOfStockProducts: number
        publishedProducts: number
        averageOrderValue: number
        ordersToday: number
        ordersThisMonth: number
        lastUpdated: string
      }

      const raw = await fetchApi<{ success: boolean; message: string; data: RawDashboardStatistics; errors?: string[] }>(
        "/admin/AdminDashboard/statistics",
      )

      if (!raw.success || !raw.data) return raw as unknown as DashboardStatsResponse

      const mapped: DashboardStats = {
        totalRevenue: Number(raw.data.totalRevenue ?? 0),
        revenueIncrease: 0,
        orders: {
          total: Number(raw.data.totalOrders ?? 0),
          increase: Number(raw.data.ordersToday ?? 0),
        },
        products: {
          total: Number(raw.data.totalProducts ?? 0),
          newProducts: Number(raw.data.publishedProducts ?? 0),
        },
        activeUsers: {
          total: Number(raw.data.totalCustomers ?? 0),
          increase: 0,
        },
      }

      return { success: true, message: raw.message, data: mapped } as DashboardStatsResponse
    } catch (error) {
      // Fallback olarak boş data döndür
      return {
        success: false,
        message: error instanceof Error ? error.message : "Dashboard istatistikleri yüklenemedi",
        data: {
          totalRevenue: 0,
          revenueIncrease: 0,
          orders: { total: 0, increase: 0 },
          products: { total: 0, newProducts: 0 },
          activeUsers: { total: 0, increase: 0 }
        },
        errors: [error instanceof Error ? error.message : "Unknown error"]
      }
    }
  },

  // Son siparişler
  getRecentOrders: async (count: number = 10) => {
    try {
      type RawOrder = {
        id: number
        orderNumber: string
        customerFirstName?: string
        customerLastName?: string
        totalAmount?: number
        orderStatusId?: number
        createdAt?: string
      }
      const raw = await fetchApi<{ success: boolean; message: string; data: RawOrder[]; errors?: string[] }>(
        `/admin/AdminDashboard/recent-orders?count=${count}`,
      )

      if (!raw.success || !raw.data) return raw as unknown as RecentOrdersResponse

      const statusMap: Record<number, string> = {
        0: "Pending",
        1: "Processing",
        2: "Completed",
        3: "Cancelled",
      }

      const mapped = raw.data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: `${o.customerFirstName ?? ""} ${o.customerLastName ?? ""}`.trim() || "-",
        status: o.orderStatusId != null ? statusMap[o.orderStatusId] ?? String(o.orderStatusId) : "-",
        total: Number(o.totalAmount ?? 0),
        date: o.createdAt ?? new Date().toISOString(),
      }))

      return { success: true, message: raw.message, data: mapped } as RecentOrdersResponse
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Son siparişler yüklenemedi",
        data: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }
    }
  },

  // En çok satan ürünler
  getTopProducts: async (count: number = 10) => {
    try {
      type RawTopProduct = {
        id: number
        name: string
        effectivePrice?: number
        quantity?: number
        createdAt?: string
      }
      const raw = await fetchApi<{ success: boolean; message: string; data: RawTopProduct[]; errors?: string[] }>(
        `/admin/AdminDashboard/top-products-get?count=${count}`,
      )

      if (!raw.success || !raw.data) return raw as unknown as TopProductsResponse

      const mapped = raw.data.map((p) => ({
        id: p.id,
        name: p.name,
        sales: Number(p.quantity ?? 0),
        revenue: Number(p.effectivePrice ?? 0),
        stock: Number(p.quantity ?? 0),
      }))

      return { success: true, message: raw.message, data: mapped } as TopProductsResponse
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "En çok satan ürünler yüklenemedi",
        data: [],
        errors: [error instanceof Error ? error.message : "Unknown error"]
      }
    }
  },

  // Satış grafik verileri
  getSalesChart: (days: number = 30) => {
    return fetchApi<SalesChartResponse>(`/admin/AdminDashboard/sales-chart?days=${days}`)
  },

  // Düşük stok uyarıları
  getLowStockAlerts: (threshold: number = 10) => {
    return fetchApi<TopProductsResponse>(`/admin/AdminDashboard/low-stock-alerts?threshold=${threshold}`)
  },

  // Gelir verileri
  getRevenue: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return fetchApi<RevenueResponse>(`/admin/AdminDashboard/revenue${query}`)
  },

  // En çok satan kategoriler
  getTopCategories: (count: number = 5) => {
    return fetchApi<TopCategoriesResponse>(`/admin/AdminDashboard/top-categories?count=${count}`)
  },

  // Sipariş durumu dağılımı
  getOrderStatusDistribution: () => {
    return fetchApi<OrderStatusDistributionResponse>("/admin/AdminDashboard/order-status-distribution")
  },
}

// ========== ADMIN USERS API ==========
export const adminUsersApi = {
  getOwnProfile: () => fetchApi<DataResponse<AdminUserDetail>>(`/admin/AdminUser/me`),

  getUsers: async (query: Partial<UsersQuery> = {}) => {
    const params = new URLSearchParams()
    if (query.pageNumber) params.set("pageNumber", String(query.pageNumber))
    if (query.pageSize) params.set("pageSize", String(query.pageSize))
    if (query.searchTerm) params.set("searchTerm", query.searchTerm)
    if (query.role) params.set("role", query.role)
    if (typeof query.isActive === "boolean") params.set("isActive", String(query.isActive))
    if (typeof query.emailConfirmed === "boolean") params.set("emailConfirmed", String(query.emailConfirmed))
    // if (query.sortBy) params.set("sortBy", query.sortBy)
    // if (query.sortOrder) params.set("sortOrder", query.sortOrder)
    const qs = params.toString() ? `?${params.toString()}` : ""

    type RawUser = {
      id: number
      email: string
      firstName: string
      lastName: string
      isActive: boolean
      createdAt: string
      roles?: string[]
    }
    type RawPagedUsers = {
      success: boolean
      message: string
      items?: RawUser[]
      Items?: RawUser[]
      pageNumber?: number
      PageNumber?: number
      pageSize?: number
      PageSize?: number
      totalCount?: number
      TotalCount?: number
      totalPages?: number
      TotalPages?: number
      hasPreviousPage?: boolean
      HasPreviousPage?: boolean
      hasNextPage?: boolean
      HasNextPage?: boolean
      errors?: string[]
    }
    const raw = await fetchApi<RawPagedUsers>(`/admin/AdminUser${qs}`)

    // Backend zaten camelCase döndürüyor; yine de korumalı map
    const items = raw.items ?? raw.Items ?? []
    const mappedItems = (items as RawUser[]).map((u: RawUser) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isActive: u.isActive,
      createdAt: u.createdAt,
      roles: Array.isArray(u.roles) ? u.roles : [],
    }))

    const response: PagedUsersResponse = {
      success: raw.success,
      message: raw.message,
      items: mappedItems,
      pageNumber: raw.pageNumber ?? raw.PageNumber ?? 1,
      pageSize: raw.pageSize ?? raw.PageSize ?? mappedItems.length,
      totalCount: raw.totalCount ?? raw.TotalCount ?? mappedItems.length,
      totalPages: raw.totalPages ?? raw.TotalPages ?? 1,
      hasPreviousPage: raw.hasPreviousPage ?? raw.HasPreviousPage ?? (raw.pageNumber ?? raw.PageNumber ?? 1) > 1,
      hasNextPage:
        raw.hasNextPage ?? raw.HasNextPage ?? (raw.pageNumber ?? raw.PageNumber ?? 1) < (raw.totalPages ?? raw.TotalPages ?? 1),
      errors: raw.errors,
    }

    return response
  },

  getUser: (id: number) => fetchApi<DataResponse<AdminUserDetail>>(`/admin/AdminUser/${id}`),

  updateUser: (id: number, payload: UpdateUserPayload) =>
    fetchApi<DataResponse<AdminUserDetail>>(`/admin/AdminUser/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changeOwnPassword: (payload: ChangeOwnPasswordPayload) =>
    fetchApi<BaseResponse>(`/admin/AdminUser/me/password`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changeOwnEmail: (payload: ChangeOwnEmailPayload) =>
    fetchApi<BaseResponse>(`/admin/AdminUser/me/email`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteUser: (id: number) => fetchApi<BaseResponse>(`/admin/AdminUser/${id}`, { method: "DELETE" }),

  getUserRoles: (id: number) => fetchApi<DataResponse<string[]>>(`/admin/AdminUser/${id}/roles`),

  setUserRoles: (id: number, roles: string[]) =>
    fetchApi<BaseResponse>(`/admin/AdminUser/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles }),
    }),

  addUserRole: (id: number, roleName: string) =>
    fetchApi<BaseResponse>(`/admin/AdminUser/${id}/roles`, {
      method: "POST",
      body: JSON.stringify({ roleName }),
    }),

  removeUserRole: (id: number, roleName: string) =>
    fetchApi<BaseResponse>(`/admin/AdminUser/${id}/roles/${encodeURIComponent(roleName)}`, { method: "DELETE" }),

  getStatistics: () => fetchApi<DataResponse<UserStatisticsDto>>(`/admin/AdminUser/statistics`),
}

// ========== ADMIN ROLES API (minimal) ==========
export const adminRolesApi = {
  createRole: (roleName: string) =>
    fetchApi<BaseResponse>(`/admin/Auth/roles`, {
      method: "POST",
      body: JSON.stringify({ roleName }),
    }),
}

export const sendCategoryData = async (formData: Record<string, unknown>): Promise<Response> => {
  return await fetch(getApiUrl("/admin/AdminCategories"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
    credentials: "same-origin",
  })
}

export const parseResponse = async (response: Response): Promise<unknown> => {
  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseText}`)
  }

  try {
    return JSON.parse(responseText)
  } catch {
    throw new Error("API yanıtı JSON formatında değil")
  }
}
