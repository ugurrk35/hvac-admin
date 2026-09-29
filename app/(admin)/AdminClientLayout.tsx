"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Tags,
  Grid,
  ListTree,
  Truck,
  UserRound,
} from "lucide-react"
import { FileText, Mail } from "lucide-react"

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Catalog",
    icon: Package,
    submenu: [
      {
        title: "Categories",
        href: "/categories",
        icon: Tags,
      },
      {
        title: "Products",
        href: "/products",
        icon: Grid,
      },
      {
        title: "Variant Types",
        href: "/variant-types",
        icon: ListTree,
      },
    ],
  },
  {
    title: "Content",
    icon: Package,
    submenu: [
      {
        title: "Pages",
        href: "/pages",
        icon: FileText,
      },
      {
        title: "Contact Messages",
        href: "/contact-messages",
        icon: Mail,
      },
    ],
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "İade Talepleri",
    href: "/return-requests",
    icon: ShoppingCart,
  },
  {
    title: "Kampanyalar",
    href: "/settings/campaigns",
    icon: Tags,
  },
  {
    title: "Shopping Carts",
    href: "/shopping-carts",
    icon: ShoppingCart,
  },
  {
    title: "Ürün Soruları",
    href: "/questions",
    icon: Package,
  },
  {
    title: "Otomasyon Merkezi",
    href: "/automation",
    icon: Settings,
  },
  {
    title: "Performans",
    href: "/performance",
    icon: LayoutDashboard,
  },
  {
    title: "Blog",
    icon: Package,
    submenu: [
      {
        title: "Blog Categories",
        href: "/blogs/categories",
        icon: Tags,
      },
      {
        title: "Blog",
        href: "/blogs",
        icon: Grid,
      },
      {
        title: "Review",
        href: "/reviews",
        icon: ListTree,
      },
    ],
  },
  {
    title: "Comments",
    icon: Package,
    submenu: [
      {
        title: "Blog Comments",
        href: "/comments/blog",
        icon: Grid,
      },
      {
        title: "Product Comments",
        href: "/comments/products",
        icon: Grid,
      },
    ],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Profilim",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Roles",
    href: "/roles",
    icon: Shield,
  },
  {
    title: "Settings",
    icon: Settings,
    submenu: [
      {
        title: "Marketing",
        href: "/settings/marketing",
        icon: Settings,
      },
      {
        title: "Dönüşüm Takibi",
        href: "/settings/tracking",
        icon: Settings,
      },
      {
        title: "ROAS Raporu",
        href: "/performance/roas",
        icon: Settings,
      },
      {
        title: "Home - Featured",
        href: "/settings/home-featured",
        icon: Settings,
      },
      {
        title: "Home - Bestsellers",
        href: "/settings/home-bestsellers",
        icon: Settings,
      },
      {
        title: "WhatsApp",
        href: "/settings/whatsapp",
        icon: Settings,
      },
      {
        title: "E-posta Şablonları",
        href: "/settings/email-templates",
        icon: Mail,
      },
      {
        title: "Footer",
        href: "/settings/footer",
        icon: Settings,
      },
      {
        title: "Ürün Detayı",
        href: "/settings/product-detail",
        icon: Package,
      },
      {
        title: "Kargo",
        href: "/settings/shipping",
        icon: Truck,
      },
      {
        title: "Kampanyalar",
        href: "/settings/campaigns",
        icon: Tags,
      },
      {
        title: "URL Yönlendirmeler",
        href: "/routes",
        icon: Settings,
      },
    ],
  },
]

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [isClient, setIsClient] = useState(false)
  const { isAuthenticated, loading, user, logout } = useAuth()

  useEffect(() => {
    setIsClient(true)

    if (user?.name) setUsername(user.name)
  }, [user])

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = "/login"
  }, [isAuthenticated, loading])

  const isSubmenuActive = (submenu: { href: string }[]) => {
    return submenu.some((item) => pathname === item.href)
  }

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  const handleLogout = () => {
    logout()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  if (!isClient || loading || !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-palette-lightBlue transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-palette-lightBlue px-6">
          <Package className="h-6 w-6 text-palette-blue" />
          <span className="font-semibold text-palette-blue">Admin Panel</span>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <div key={item.title} className="space-y-1">
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                      ${
                        isSubmenuActive(item.submenu)
                          ? "bg-palette-blue text-black"
                          : "text-gray-600 hover:bg-palette-lightBlue/20"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 
                      ${openSubmenu === item.title ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openSubmenu === item.title && (
                    <div className="pl-9 space-y-1 pt-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            pathname === subItem.href
                              ? "bg-palette-lightBlue text-palette-blue font-medium"
                              : "text-gray-600 hover:bg-palette-lightBlue/20"
                          }`}
                        >
                          <subItem.icon className="h-4 w-4" />
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    pathname === item.href
                      ? "bg-palette-blue text-black"
                      : "text-gray-600 hover:bg-palette-lightBlue/20"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="shrink-0 p-4 pt-0">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-palette-lightBlue text-palette-blue hover:bg-palette-lightBlue/20"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-palette-lightBlue bg-white">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-palette-blue hover:bg-palette-lightBlue/20"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-palette-blue">{username}</span>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-10rem)]">
          <div className="p-6">{children}</div>
        </main>

        <footer className="border-t border-palette-lightBlue">
          <div className="px-6 py-4">
            <p className="text-center text-sm text-palette-blue">
              © 2026 E-commerce Admin Panel. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
