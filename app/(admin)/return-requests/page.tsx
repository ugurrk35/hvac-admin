"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  ExternalLink,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchApi } from "@/lib/api";
import { safeExternalUrl } from "@/lib/external-url";
type ReturnRequest = {
  id: number;
  orderId: number;
  orderNumber: string;
  customerFirstName?: string;
  customerLastName?: string;
  reason: string;
  customerNote?: string;
  status: number;
  adminNote?: string;
  returnLabelUrl?: string;
  returnTrackingNumber?: string;
  items?: {
    orderItemId: number;
    productName: string;
    quantity: number;
    variantSnapshot?: string;
  }[];
  createdAt: string;
};
const labels: Record<number, string> = {
  0: "Bekliyor",
  1: "Onaylandı",
  2: "Reddedildi",
  3: "Teslim alındı",
  4: "Kapandı",
};
export default function ReturnRequestsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ReturnRequest | null>(null);
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const load = () =>
    fetchApi<{ data?: ReturnRequest[] }>("admin/AdminOrder/return-requests")
      .then((response) => setItems(response.data ?? []))
      .catch(() => setMessage("İade talepleri yüklenemedi."));
  useEffect(() => {
    void load();
  }, []);
  const visible = useMemo(
    () =>
      items.filter((item) =>
        `${item.orderNumber} ${item.customerFirstName ?? ""} ${item.customerLastName ?? ""} ${item.reason}`
          .toLocaleLowerCase("tr-TR")
          .includes(query.toLocaleLowerCase("tr-TR")),
      ),
    [items, query],
  );
  const openEditor = (item: ReturnRequest) => {
    setEditing(item);
    setNote(item.adminNote ?? "");
    setTracking(item.returnTrackingNumber ?? "");
    setLabelUrl(item.returnLabelUrl ?? "");
  };
  const update = async (status: number) => {
    if (!editing) return;
    if (labelUrl && !safeExternalUrl(labelUrl)) {
      setMessage("İade etiketi URL'si HTTP veya HTTPS olmalıdır.");
      return;
    }
    try {
      await fetchApi(`admin/AdminOrder/return-requests/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          adminNote: note,
          returnTrackingNumber: tracking,
          returnLabelUrl: labelUrl,
        }),
      });
      setMessage("İade talebi güncellendi.");
      setEditing(null);
      await load();
    } catch {
      setMessage("Talep güncellenemedi.");
    }
  };
  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg md:p-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-rose-200">
              <ClipboardList className="size-4" />
              Satış sonrası operasyon
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              İade talepleri
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              İade kalemlerini, müşteri notunu, etiketi ve kargo takip bilgisini
              tek akışta yönetin.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs text-slate-300">Açık talep</p>
            <p className="mt-1 text-xl font-semibold">
              {items.filter((item) => [0, 1, 3].includes(item.status)).length}
            </p>
          </div>
        </div>
      </div>
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <Check className="size-4" />
          {message}
        </div>
      )}
      {editing && (
        <Card className="border-rose-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                İade #{editing.orderNumber} işlemi
              </h2>
              <p className="text-sm text-muted-foreground">
                Not, iade etiketi ve takip bilgilerini kaydedin; sonra yeni
                durumu seçin.
              </p>
            </div>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Kapat
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Textarea
              placeholder="Yönetici notu"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Input
              placeholder="İade takip numarası"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />
            <Input
              placeholder="İade etiketi URL'si"
              value={labelUrl}
              onChange={(e) => setLabelUrl(e.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {editing.status === 0 && (
              <>
                <Button onClick={() => void update(1)}>Onayla</Button>
                <Button variant="destructive" onClick={() => void update(2)}>
                  Reddet
                </Button>
              </>
            )}
            {editing.status === 1 && (
              <Button onClick={() => void update(3)}>
                <PackageCheck className="mr-2 size-4" />
                Teslim alındı
              </Button>
            )}
            {editing.status === 3 && (
              <Button onClick={() => void update(4)}>İadeyi kapat</Button>
            )}
          </div>
        </Card>
      )}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between md:px-7">
          <div>
            <h2 className="font-bold text-slate-900">İade gelen kutusu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visible.length} talep gösteriliyor.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="w-72 pl-9"
              placeholder="Sipariş, müşteri veya neden ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 md:px-7">Sipariş</th>
                <th className="px-5 py-3">Müşteri / Kalemler</th>
                <th className="px-5 py-3">Neden / Kargo</th>
                <th className="px-5 py-3">Durum</th>
                <th className="px-5 py-3 md:px-7" />
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t align-top transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900 md:px-7">
                      #{item.orderNumber}
                      <p className="mt-1 text-xs font-normal text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {[item.customerFirstName, item.customerLastName]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </p>
                      {item.items?.map((line) => (
                        <p
                          key={line.orderItemId}
                          className="mt-1 text-xs text-slate-600"
                        >
                          {line.productName} × {line.quantity}
                          {line.variantSnapshot
                            ? ` · ${line.variantSnapshot}`
                            : ""}
                        </p>
                      ))}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{item.reason}</p>
                      {item.customerNote && (
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          {item.customerNote}
                        </p>
                      )}
                      {item.returnTrackingNumber && (
                        <p className="mt-2 flex items-center gap-1 text-xs">
                          <Truck className="size-3" />
                          {item.returnTrackingNumber}
                        </p>
                      )}
                      {item.returnLabelUrl && (
                        <a
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 underline"
                          href={safeExternalUrl(item.returnLabelUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="size-3" />
                          İade etiketi
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        className={
                          item.status === 2
                            ? "bg-rose-100 text-rose-800 hover:bg-rose-100"
                            : item.status === 4
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-100"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        }
                      >
                        {labels[item.status] ?? item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right md:px-7">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditor(item)}
                      >
                        İşlem
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-muted-foreground"
                  >
                    <ClipboardList className="mx-auto mb-3 size-8 text-slate-300" />
                    Talep bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
