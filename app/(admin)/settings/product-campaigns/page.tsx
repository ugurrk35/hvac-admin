"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

type Option = {
  id?: number;
  label: string;
  priceAdjustment: number;
  isDefault: boolean;
};
type Group = {
  id?: number;
  code: string;
  label: string;
  isRequired: boolean;
  options: Option[];
};
type Location = {
  id?: number;
  city: string;
  district?: string | null;
  priceAdjustment: number;
};
type Package = {
  id: number;
  productId: number;
  productName: string;
  title: string;
  description: string;
  startingPrice: number;
  requiresExistingDevicePhoto: boolean;
  sortOrder: number;
  isActive: boolean;
  locations: Location[];
  groups: Group[];
};
type Product = { id: number; name: string; sku: string };
const empty = (): Omit<Package, "id" | "productName"> => ({
  productId: 0,
  title: "Kampanyalı satın al",
  description:
    "Montaj ve proje kapsamını seçin; kampanyalı toplamı anında görün.",
  startingPrice: 0,
  requiresExistingDevicePhoto: false,
  sortOrder: 0,
  isActive: true,
  locations: [{ city: "İstanbul", priceAdjustment: 0 }],
  groups: [
    {
      code: "montaj",
      label: "Montaj hizmeti",
      isRequired: true,
      options: [{ label: "Montaj dahil", priceAdjustment: 0, isDefault: true }],
    },
  ],
});

export default function ProductCampaignsPage() {
  const [items, setItems] = useState<Package[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [form, setForm] = useState<Omit<Package, "id" | "productName">>(empty()),
    [editing, setEditing] = useState<number | null>(null),
    [message, setMessage] = useState("");
  const load = async () => {
    const [list, lookups] = await Promise.all([
      fetchApi<{ data: Package[] }>("/admin/product-campaigns"),
      fetchApi<{ products: Product[] }>("/admin/product-campaigns/lookups"),
    ]);
    setItems(list.data ?? []);
    setProducts(lookups.products ?? []);
  };
  useEffect(() => {
    void load().catch(() => setMessage("Paketler yüklenemedi."));
  }, []);
  const save = async () => {
    try {
      if (!form.productId) throw new Error("Ürün seçmelisiniz.");
      await fetchApi(
        editing
          ? `/admin/product-campaigns/${editing}`
          : "/admin/product-campaigns",
        { method: editing ? "PUT" : "POST", body: JSON.stringify(form) },
      );
      setForm(empty());
      setEditing(null);
      setMessage("Paket kaydedildi.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Paket kaydedilemedi.");
    }
  };
  const edit = (item: Package) => {
    const { id, productName, ...data } = item;
    setEditing(id);
    setForm(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (id: number) => {
    if (!confirm("Paket kaldırılsın mı?")) return;
    await fetchApi(`/admin/product-campaigns/${id}`, { method: "DELETE" });
    await load();
  };
  const updateGroup = (index: number, group: Group) =>
    setForm((v) => ({
      ...v,
      groups: v.groups.map((x, i) => (i === index ? group : x)),
    }));
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-slate-950 p-7 text-white">
        <p className="text-sm text-blue-200">Kombi kampanya yapılandırması</p>
        <h1 className="mt-1 text-3xl font-bold">Montaj paketleri</h1>
        <p className="mt-2 text-sm text-slate-300">
          Ürüne özel şehir, montaj ve ek hizmet fiyatlarını yönetin.
        </p>
      </div>
      {message && (
        <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
          {message}
        </p>
      )}
      <Card className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {editing ? "Paketi düzenle" : "Yeni paket"}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setForm(empty());
            }}
          >
            <Plus className="mr-2 size-4" />
            Yeni paket
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label>
            Ürün
            <select
              className="mt-1 h-10 w-full rounded-md border px-3"
              value={form.productId}
              onChange={(e) =>
                setForm((v) => ({ ...v, productId: Number(e.target.value) }))
              }
            >
              <option value={0}>Ürün seçiniz</option>
              {products.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name} · {p.sku}
                </option>
              ))}
            </select>
          </label>
          <label>
            Başlık
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) =>
                setForm((v) => ({ ...v, title: e.target.value }))
              }
            />
          </label>
          <label>
            Başlangıç fiyatı
            <Input
              className="mt-1"
              type="number"
              value={form.startingPrice}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  startingPrice: Number(e.target.value),
                }))
              }
            />
          </label>
        </div>
        <label className="block">
          Açıklama
          <textarea
            className="mt-1 min-h-20 w-full rounded-md border p-3 text-sm"
            value={form.description}
            onChange={(e) =>
              setForm((v) => ({ ...v, description: e.target.value }))
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((v) => ({ ...v, isActive: e.target.checked }))
            }
          />{" "}
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.requiresExistingDevicePhoto}
            onChange={(e) =>
              setForm((v) => ({ ...v, requiresExistingDevicePhoto: e.target.checked }))
            }
          />{" "}
          Eski cihaz fotoğrafı zorunlu
        </label>
        <section className="space-y-3 rounded-lg bg-slate-50 p-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">Lokasyonlar</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setForm((v) => ({
                  ...v,
                  locations: [...v.locations, { city: "", priceAdjustment: 0 }],
                }))
              }
            >
              Ekle
            </Button>
          </div>
          {form.locations.map((location, index) => (
            <div className="grid gap-2 md:grid-cols-3" key={index}>
              <Input
                placeholder="İl"
                value={location.city}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    locations: v.locations.map((x, i) =>
                      i === index ? { ...x, city: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Input
                placeholder="İlçe (opsiyonel)"
                value={location.district ?? ""}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    locations: v.locations.map((x, i) =>
                      i === index ? { ...x, district: e.target.value } : x,
                    ),
                  }))
                }
              />
              <Input
                type="number"
                placeholder="Fiyat farkı"
                value={location.priceAdjustment}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    locations: v.locations.map((x, i) =>
                      i === index
                        ? { ...x, priceAdjustment: Number(e.target.value) }
                        : x,
                    ),
                  }))
                }
              />
            </div>
          ))}
        </section>
        <section className="space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">Hizmet lookup’ları</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setForm((v) => ({
                  ...v,
                  groups: [
                    ...v.groups,
                    {
                      code: "",
                      label: "",
                      isRequired: false,
                      options: [
                        { label: "", priceAdjustment: 0, isDefault: true },
                      ],
                    },
                  ],
                }))
              }
            >
              Grup ekle
            </Button>
          </div>
          {form.groups.map((group, index) => (
            <div className="space-y-3 rounded-lg border p-4" key={index}>
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Kod (örn. montaj)"
                  value={group.code}
                  onChange={(e) =>
                    updateGroup(index, { ...group, code: e.target.value })
                  }
                />
                <Input
                  placeholder="Alan başlığı"
                  value={group.label}
                  onChange={(e) =>
                    updateGroup(index, { ...group, label: e.target.value })
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={group.isRequired}
                    onChange={(e) =>
                      updateGroup(index, {
                        ...group,
                        isRequired: e.target.checked,
                      })
                    }
                  />{" "}
                  Zorunlu
                </label>
              </div>
              {group.options.map((option, optionIndex) => (
                <div
                  className="grid gap-2 md:grid-cols-[1fr_160px_auto]"
                  key={optionIndex}
                >
                  <Input
                    placeholder="Seçenek adı"
                    value={option.label}
                    onChange={(e) =>
                      updateGroup(index, {
                        ...group,
                        options: group.options.map((x, i) =>
                          i === optionIndex
                            ? { ...x, label: e.target.value }
                            : x,
                        ),
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Fiyat farkı"
                    value={option.priceAdjustment}
                    onChange={(e) =>
                      updateGroup(index, {
                        ...group,
                        options: group.options.map((x, i) =>
                          i === optionIndex
                            ? { ...x, priceAdjustment: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`default-${index}`}
                      checked={option.isDefault}
                      onChange={() =>
                        updateGroup(index, {
                          ...group,
                          options: group.options.map((x, i) => ({
                            ...x,
                            isDefault: i === optionIndex,
                          })),
                        })
                      }
                    />{" "}
                    Varsayılan
                  </label>
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateGroup(index, {
                    ...group,
                    options: [
                      ...group.options,
                      { label: "", priceAdjustment: 0, isDefault: false },
                    ],
                  })
                }
              >
                Seçenek ekle
              </Button>
            </div>
          ))}
        </section>
        <Button onClick={save}>
          <Save className="mr-2 size-4" />
          {editing ? "Kaydet" : "Paketi oluştur"}
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b p-5 font-bold">Tanımlı paketler</div>
        <div className="divide-y">
          {items.length ? (
            items.map((item) => (
              <div
                className="flex items-center justify-between gap-4 p-5"
                key={item.id}
              >
                <div>
                  <b>{item.title}</b>
                  <p className="text-sm text-slate-500">
                    {item.productName} ·{" "}
                    {item.startingPrice.toLocaleString("tr-TR")} TL ·{" "}
                    {item.locations.length} lokasyon · {item.groups.length}{" "}
                    hizmet alanı
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => edit(item)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => void remove(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              Henüz paket yok.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
