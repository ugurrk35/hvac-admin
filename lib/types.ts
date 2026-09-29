

export interface  BlogCategoryBlogPost{
  id: number
  name: string
  slug?: string
  postCount?: number
}
export interface  AddressEdit  {
  country: string
  city: string
  district: string
  addressLine: string
  postalCode: string
}

export interface  OrderItemEdit  {
  productId?: number
  productName: string
  quantity: number
  unitPrice: number
  listUnitPrice?: number
  productDiscountTotal?: number
  productImageUrl?: string
  variantSnapshot?: string
  productCampaignPackageId?: number
  campaignSnapshotJson?: string
}
export interface OrderEdit {
  id: number
  userId?: number
  guestIdentifier?: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  notes?: string
  orderNumber: string
  shoppingCartId?: number
  totalAmount: number
  shippingAmount?: number
  campaignDiscountTotal?: number
  paymentMethodId?: number
  paymentMethodName?: string
  paymentStatusId?: number
  paymentReference?: string
  refundedAmount?: number
  refundableAmount?: number
  shippingMethodId?: number
  shippingMethodName?: string
  shippingAddress: AddressEdit
  billingAddress: AddressEdit
  orderStatusId: number
  ordersItems: OrderItemEdit[]
  cargoTracking?: string
}
export interface OrderTimelineItem {
  occurredAt: string
  type: "status" | "refund" | "archive" | "restore"
  title: string
  description: string
  actor?: string | null
}
export interface OrderNote {
  id: number
  content: string
  createdAt: string
  createdBy?: string | null
}
export interface OrderListSummary {
  totalCount: number
  totalAmount: number
  needsAttentionCount: number
  shippedCount: number
}
export interface BlogPostDetail {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  publishDate: string
  isPublished: boolean
  isFeatured: boolean
  blogCategoryId: number
  blogCategoryName: string
  images: BlogImage[]
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  canonicalUrl: string
  schemaJson: string
}
export interface BlogImage {
  id: number
  url: string
}
export interface BlogPost  {
  id: number
  title: string
  slug: string
  excerpt: string
  publishDate: string
  views: number
  blogCategory: BlogCategoryBlogPost
}

// ========== USERS & ROLES ==========
export interface AdminUserListItem {
  id: number
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: string
  roles: string[]
}

export interface AdminUserDetail extends AdminUserListItem {
  userName?: string | null
  phoneNumber?: string | null
  emailConfirmed?: boolean
  phoneNumberConfirmed?: boolean
}

export type UpdateUserPayload = {
  email: string
  firstName: string
  lastName: string
  userName?: string | null
  phoneNumber?: string | null
  isActive: boolean
  emailConfirmed: boolean
  phoneNumberConfirmed: boolean
  roles?: string[]
}

export type ChangeOwnPasswordPayload = {
  currentPassword: string
  newPassword: string
}

export type ChangeOwnEmailPayload = {
  email: string
  currentPassword: string
}

export type UsersQuery = {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  role?: string
  isActive?: boolean
  emailConfirmed?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PagedUsersResponse {
  items: AdminUserListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  success: boolean
  message: string
  errors?: string[]
}

export interface DataResponse<T> {
  success: boolean
  message: string
  data?: T
  errors?: string[]
}

export interface BaseResponse {
  success: boolean
  message: string
  errors?: string[]
}

// Admin moderation list item types
export interface AdminReviewListItem {
  id: number
  productId: number
  title: string
  rating: number
  content: string
  isApproved: boolean
  authorName?: string | null
  createdAt?: string
}

export interface AdminQuestionListItem {
  id: number
  productId: number
  question: string
  answer?: string | null
  isApproved: boolean
}

export interface UserStatisticsDto {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  blockedUsers: number
  emailConfirmedUsers: number
  emailUnconfirmedUsers: number
  usersRegisteredToday: number
  usersRegisteredThisWeek: number
  usersRegisteredThisMonth: number
  usersByRole: Record<string, number>
  lastRegistrationDate: string
  lastLoginDate: string
  averageUsersPerDay: number
  mostActiveUsersCount: number
  lastUpdated: string
}
export type ProductAttributeValueInput = {
  value: string
  priceModifier: number
}
// NOTE: ProductAttribute is defined later with full shape (used across admin UI).
// The earlier minimal declaration removed to avoid duplicate identifier errors.

export interface ProductAttributeResponse {
  id: number
  name: string
  displayOrder: number
  isActive: boolean
  createdAt: string // ISO date string
}
export type CreateProductAttributePayload = {
  name: string
  isPersonalizationText: boolean
  textPrompt: string
  maxLength: number
  productAttributeValues: ProductAttributeValueInput[]
}

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  description: string
  shortDescription: string
  basePrice: number
  discountPrice: number
  quantity: number
  isPublished: boolean
  categoryId: number
  brand: string
  gtin: string
  mpn: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterCardType: string
  productImages: ProductImage[]
  attributeCombinations: AttributeCombination[]
}
export interface ProductsResponse  {
  success: boolean
  items: ProductListItemNew[]
  totalCount: number
  totalPages: number
}

export interface ProductAttribute {
  id: number;
  name: string;
  // some files use `isPersonalization`, others `isPersonalizationText` — keep both for compatibility
  isPersonalization?: boolean;
  isPersonalizationText?: boolean;
  textPrompt?: string;
  maxLength?: number;
  productAttributeValues: ProductAttributeValue[];
}
export interface ProductAttributeValue {
  id?: number;
  value: string;
  priceModifier: number;
  productAttributeId?: number;
}
export interface Order {
  id: number
  orderNumber: string
  fullName: string
  createDate: string
  orderStatusName: string
  totalAmount: number
}


export interface CreateBlogPostNewDto {
  title: string
  slug: string
  excerpt: string
  content: string
  blogCategoryId: number
  publishDate: string
  isPublished: boolean
  isFeatured: boolean
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  canonicalUrl: string
  schemaJson: string
  tagIds: number[]
  imageIds: number[]
}
export type BlogCategoryList = {
  id: number
  name: string
  description?: string
  createdAt: string
}
export type BlogCategory = {
  id?: number
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  canonicalUrl: string
}
export interface ShoppingCartTypeCartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}
export interface LoginUser {
  id?: string | number
  name?: string
}

export interface User  {
  id?: string | number
  name?: string
  email?: string  // zorunlu değil artık
}
export interface ShoppingCartTypeDtails {
  id: number;
  userId?: number;
  guestIdentifier?: string;
  totalAmount: number;
  isOrdered: boolean;
  createdAt: string;
  lastModifiedAt: string;
  cartItems: ShoppingCartTypeCartItem[];
  user?: { firstName: string; lastName: string; email: string };
}
export interface ShoppingCartType {
  id: number;
  userId?: number;
  guestIdentifier?: string;
  totalAmount: number;
  isOrdered: boolean;
  createdAt: string;
  lastModifiedAt: string;
  // cartItems: any[];
  user?: { firstName: string; lastName: string; email: string };
}

// Marketing / Analytics ayar tipi
export interface MarketingSettings {
  id?: number
  gtmContainerId?: string | null
  googleAnalyticsId?: string | null
  facebookPixelId?: string | null
  tikTokPixelId?: string | null
  metaConversionApiKey?: string | null
  isGTMEnabled: boolean
  isGAEnabled: boolean
  isFacebookEnabled: boolean
  isTikTokEnabled: boolean
  updatedAt?: string | null
  updatedBy?: string | null
}

export type ApiResponse<T> = {
  data: T
  success: boolean
  message?: string
  errors?: string[]
}
export interface ProductTag {
  id: number
  name: string
  slug: string
  isActive: boolean
}

// CreateProductTagPayload interface'ini ekle
export interface CreateProductTagPayload {
  name: string
  slug: string
  isActive: boolean
}

// Yeni Product API response tiplerini ekle
export interface ProductListItemNew {
  id: number
  name: string
  slug: string
  sku: string
  shortDescription: string
  basePrice: number
  discountPrice: number
  effectivePrice: number
  isPublished: boolean
  quantity: number
  inStock: boolean
  brand: string
  createdAt: string
  categoryId: number
  categoryName: string
  mainImageUrl: string | null
  tagNames: string[]
}
export type BlogCategoryDetail = {
  id: number
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  canonicalUrl: string
  postCount: number
  posts: { id: number; title: string; slug: string }[]
}
export interface CreateCategoryPayload {
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterCardType: string
  [key: string]: unknown
}
export interface UpdateCategoryPayload {
  id: number
  // Diğer alanlar CreateCategoryPayload ile aynı
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterCardType: string
  [key: string]: unknown
}

export interface ProductsResponseNew {
  items: ProductListItemNew[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  success: boolean
  message: string
  errors: string[]
}

// ========== CATEGORY TYPES ==========
export interface Category {
  id: number
  name: string
  slug: string
  description: string
  products?: Array<{ id: number; name: string }>
}

export interface CategoryResponse {
  success: boolean
  message: string
  data: Category
  errors?: string[]
}

export interface CategoriesListResponse {
  success: boolean
  message: string
  data: Category[]
  errors?: string[]
}

// ========== PRODUCT CREATION ==========
export interface ProductImage {
  imageId: number
  sortOrder?: number
  title?: string
  altText?: string
  caption?: string
}

export interface AttributeCombinationValueInput {
  productAttributeId: number
  productAttributeValueId: number
}

export interface AttributeCombination {
  sku: string
  price: number
  quantity: number
  attributeValues: AttributeCombinationValueInput[]
}

export interface CreateProductPayloadNew {
  // Basics
  name: string
  slug: string
  sku: string
  shortDescription: string
  description: string
  basePrice: number
  discountPrice: number
  isPublished: boolean
  quantity: number
  categoryId: number

  // SEO
  metaTitle: string
  metaDescription: string
  metaKeywords?: string
  canonicalUrl?: string

  // Social
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCardType?: string

  // Product Info
  brand?: string
  gtin?: string
  mpn?: string

  // Tags
  productTagIds?: number[] | null

  // Images
  productImages: ProductImage[]

  // Attribute combinations
  attributeCombinations?: AttributeCombination[]

  // Related products (optional, max 4)
  relatedProductIds?: number[] | null
}

// Dashboard API Types
export interface DashboardStats {
  totalRevenue: number
  revenueIncrease: number
  orders: {
    total: number
    increase: number
  }
  products: {
    total: number
    newProducts: number
  }
  activeUsers: {
    total: number
    increase: number
  }
}

export interface RecentOrder {
  id: number
  orderNumber: string
  customer: string
  status: string
  total: number
  date: string
}

export interface TopProduct {
  id: number
  name: string
  sales: number
  revenue: number
  stock: number
}

export interface SalesChartData {
  date: string
  sales: number
  revenue: number
}

export interface SalesChartDto {
  data: SalesChartData[]
  totalSales: number
  totalRevenue: number
}

export interface CategorySalesDto {
  categoryId: number
  categoryName: string
  totalSales: number
  totalRevenue: number
  productCount: number
}

// API Response Types
export interface DashboardStatsResponse {
  success: boolean
  message: string
  data: DashboardStats
  errors?: string[]
}

export interface RecentOrdersResponse {
  success: boolean
  message: string
  data: RecentOrder[]
  errors?: string[]
}

export interface TopProductsResponse {
  success: boolean
  message: string
  data: TopProduct[]
  errors?: string[]
}

export interface SalesChartResponse {
  success: boolean
  message: string
  data: SalesChartDto
  errors?: string[]
}

// --- Lookup types used by product add/edit pages ---
export interface LookupProductAttributeValue {
  id: number
  name?: string
  productAttributeId: number
}

export interface LookupProductAttribute {
  id: number
  name: string
  // compatibility
  isPersonalization?: boolean
  isPersonalizationText?: boolean
  textPrompt?: string
  maxLength?: number
  productAttributeValues: LookupProductAttributeValue[]
}

export interface LookupCategory {
  id: number
  name: string
}

export interface UploadedImage {
  id: number
  url: string
  title?: string
  // additional UI properties used in product add/edit pages
  file?: File | null
  fileName?: string
  sortOrder?: number
  altText?: string
  caption?: string
  uploading?: boolean
  uploadError?: string | null
}

export interface TopCategoriesResponse {
  success: boolean
  message: string
  data: CategorySalesDto[]
  errors?: string[]
}

export interface OrderStatusDistributionResponse {
  success: boolean
  message: string
  data: Record<string, number>
  errors?: string[]
}

export interface RevenueResponse {
  success: boolean
  message: string
  data: Record<string, number>
  errors?: string[]
}

// Dashboard simplified view model used in admin panel UI
export interface DashboardStats {
  totalRevenue: number
  revenueIncrease: number
  orders: { total: number; increase: number }
  products: { total: number; newProducts: number }
  activeUsers: { total: number; increase: number }
}
