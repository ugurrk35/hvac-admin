"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/Checkbox"
import { Badge } from "@/components/ui/badge"
import { adminRolesApi, adminUsersApi } from "@/lib/api"
import type { AdminUserDetail, UpdateUserPayload } from "@/lib/types"

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = Number(params?.id)

  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userName, setUserName] = useState<string | "" | null>("")
  const [phoneNumber, setPhoneNumber] = useState<string | "" | null>("")
  const [isActive, setIsActive] = useState(true)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [phoneConfirmed, setPhoneConfirmed] = useState(false)
  const [roles, setRoles] = useState<string[]>([])
  const [newRole, setNewRole] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const init = async () => {
      try {
        setLoading(true)
        const res = await adminUsersApi.getUser(userId)
        if (res.success) {
          const u = res.data
          if (u) {
            setUser(u)
            setEmail(u.email)
            setFirstName(u.firstName)
            setLastName(u.lastName)
            setUserName(u.userName || "")
            setPhoneNumber(u.phoneNumber || "")
            setIsActive(u.isActive)
            setEmailConfirmed(Boolean((u as AdminUserDetail).emailConfirmed))
            setPhoneConfirmed(Boolean((u as AdminUserDetail).phoneNumberConfirmed))
            setRoles(u.roles || [])
          }
        } else {
          throw new Error(res.message)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kullanıcı getirilemedi")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [userId])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const payload: UpdateUserPayload = {
        email,
        firstName,
        lastName,
        userName: userName || undefined,
        phoneNumber: phoneNumber || undefined,
        isActive,
        emailConfirmed,
        phoneNumberConfirmed: phoneConfirmed,
        roles,
      }
      await adminUsersApi.updateUser(user.id, payload)
      await adminUsersApi.setUserRoles(user.id, roles)
      router.push("/users")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi")
    } finally {
      setSaving(false)
    }
  }

  const handleAddRole = async () => {
    const roleName = newRole.trim()
    if (!roleName) return
    try {
      await adminRolesApi.createRole(roleName)
      if (!roles.includes(roleName)) setRoles((r) => [...r, roleName])
      setNewRole("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rol eklenemedi")
    }
  }

  const handleRemoveRole = (role: string) => setRoles((r) => r.filter((x) => x !== role))

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!user) return <div>Bulunamadı</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">Kullanıcı Düzenle</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>E-posta</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Kullanıcı Adı</Label>
              <Input value={userName || ""} onChange={(e) => setUserName(e.target.value)} />
            </div>
            <div>
              <Label>Ad</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Soyad</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={phoneNumber || ""} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="isActive" checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emailConfirmed" checked={emailConfirmed} onCheckedChange={(v) => setEmailConfirmed(Boolean(v))} />
              <Label htmlFor="emailConfirmed">E-posta Onaylı</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="phoneConfirmed" checked={phoneConfirmed} onCheckedChange={(v) => setPhoneConfirmed(Boolean(v))} />
              <Label htmlFor="phoneConfirmed">Telefon Onaylı</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Roller</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge key={r} variant="outline" className="cursor-pointer" onClick={() => handleRemoveRole(r)}>
                  {r} ✕
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Yeni rol adı" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              <Button type="button" onClick={handleAddRole}>
                Rol Ekle
              </Button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => router.push("/users")}>İptal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-palette-blue hover:bg-palette-lightBlue">
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


