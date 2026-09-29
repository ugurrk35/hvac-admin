

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: string[]
}
export interface PagedResponse<T> {
  items: T[]
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}
export type ApiPagedResponse<T> = ApiResponse<PagedResponse<T>>