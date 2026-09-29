"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, DollarSign, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardStats, RecentOrder, TopProduct } from "@/lib/types"
import { dashboardApi } from "@/lib/api"

function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Toplam Gelir</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalRevenue.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.revenueIncrease > 0 ? '+' : ''}{stats.revenueIncrease}% geçen aydan
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Siparişler</CardTitle>
          <ShoppingCart className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.orders.total}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.orders.increase} son saatte
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Ürünler</CardTitle>
          <Package className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.products.total}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.products.newProducts} yeni ürün
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Aktif Kullanıcılar</CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.activeUsers.total}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.activeUsers.increase} son saatte
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Siparişler</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz sipariş bulunmuyor</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber || order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {order.total.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function TopProductsTable({ products }: { products: TopProduct[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>En Çok Satan Ürünler</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz satış verisi bulunmuyor</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Satış</TableHead>
                <TableHead>Gelir</TableHead>
                <TableHead className="text-right">Stok</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">{product.sales}</span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {product.revenue.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Loading */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables Loading */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsResponse, ordersResponse, productsResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentOrders(5),
        dashboardApi.getTopProducts(5),
      ])

      // Stats verisi
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
        
      } else if (!statsResponse.success) {
        // Fallback stats göster
        setStats({
          totalRevenue: 0,
          revenueIncrease: 0,
          orders: { total: 0, increase: 0 },
          products: { total: 0, newProducts: 0 },
          activeUsers: { total: 0, increase: 0 }
        })
      }

      // Orders verisi
      if (ordersResponse.success && ordersResponse.data) {
        setRecentOrders(ordersResponse.data)
      } else if (!ordersResponse.success) {
        setRecentOrders([])
      }

      // Products verisi
      if (productsResponse.success && productsResponse.data) {
        setTopProducts(productsResponse.data)
      } else if (!productsResponse.success) {
        setTopProducts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dashboard verileri yüklenirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return <DashboardLoading />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <br />
          <Button
            onClick={fetchDashboardData}
            className="mt-2 bg-palette-blue hover:bg-palette-lightBlue"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {stats && <StatsCards stats={stats} />}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <RecentOrdersTable orders={recentOrders} />
        <TopProductsTable products={topProducts} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Dashboard</h1>
      </div>
      <DashboardContent />
    </div>
  )
}
