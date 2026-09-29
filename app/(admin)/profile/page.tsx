"use client"

import { FormEvent, useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminUsersApi } from "@/lib/api"

export default function ProfilePage() {
  const [email, setEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<"email" | "password" | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await adminUsersApi.getOwnProfile()
        if (response.success && response.data?.email) setEmail(response.data.email)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Profil bilgisi getirilemedi.")
      }
    }
    loadProfile()
  }, [])

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSaving("email")
    try {
      const response = await adminUsersApi.changeOwnEmail({ email, currentPassword: emailPassword })
      if (!response.success) throw new Error(response.message || "E-posta değiştirilemedi.")
      setEmailPassword("")
      setMessage(response.message || "E-posta adresiniz değiştirildi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-posta değiştirilemedi.")
    } finally {
      setSaving(null)
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setError("Yeni şifre ve tekrarı aynı olmalı.")
      return
    }
    setSaving("password")
    try {
      const response = await adminUsersApi.changeOwnPassword({ currentPassword, newPassword })
      if (!response.success) throw new Error(response.message || "Şifre değiştirilemedi.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setMessage(response.message || "Şifreniz değiştirildi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şifre değiştirilemedi.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-palette-blue">Profilim</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kendi e-posta adresinizi ve şifrenizi güvenli şekilde güncelleyin.</p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {message && <Alert><AlertDescription>{message}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle>E-posta adresi</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitEmail}>
            <div className="space-y-2"><Label htmlFor="email">Yeni e-posta</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="email-password">Mevcut şifre</Label><Input id="email-password" type="password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} required /></div>
            <Button type="submit" disabled={saving !== null}>{saving === "email" ? "Kaydediliyor..." : "E-postayı güncelle"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Şifre değiştir</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitPassword}>
            <div className="space-y-2"><Label htmlFor="current-password">Mevcut şifre</Label><Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="new-password">Yeni şifre</Label><Input id="new-password" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /><p className="text-xs text-muted-foreground">En az 8 karakter girin.</p></div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Yeni şifre (tekrar)</Label><Input id="confirm-password" type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            <Button type="submit" disabled={saving !== null}>{saving === "password" ? "Kaydediliyor..." : "Şifreyi değiştir"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
