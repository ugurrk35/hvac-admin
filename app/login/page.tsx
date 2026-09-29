"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/hooks/useAuth"
import { User } from "@/lib/types"

// interface LoginResponse {
//   token: string
// }

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
  
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`)
      }

      const raw = await response.json()
      login(raw.user as User | undefined)

      // Dashboard'a yönlendir
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş yapılırken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-lightBlue via-palette-pink to-palette-lavender">
      <div className="w-full max-w-md p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-2 mb-6">
          <Package2 className="h-12 w-12 text-palette-blue" />
          <h1 className="text-2xl font-bold text-palette-blue">Admin Panel</h1>
          <p className="text-muted-foreground">Hesabınıza giriş yapın</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">E-posta adresi</Label>
            <Input
              id="identifier"
              name="identifier"
              type="email"
              autoComplete="email"
              placeholder="E-posta adresinizi girin"
              value={formData.identifier}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-palette-lightBlue focus-visible:ring-palette-blue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Şifrenizi girin"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="border-palette-lightBlue focus-visible:ring-palette-blue"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-palette-blue hover:bg-palette-lightBlue text-white transition-colors"
            disabled={loading}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>

      </div>
    </div>
  )
}
