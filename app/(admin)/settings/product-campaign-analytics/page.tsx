"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShoppingCart, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";

type Row = {
  packageId: number;
  productId: number;
  productName: string;
  title: string;
  events: Record<string, number>;
  orders: number;
  revenue: number;
};

const number = (value: number) => new Intl.NumberFormat("tr-TR").format(value);
const money = (value: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);

export default function ProductCampaignAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetchApi<{ data: Row[] }>(`/admin/product-campaigns/analytics?days=${days}`)
      .then((response) => { setItems(response.data ?? []); setError(""); })
      .catch(() => setError("Kampanya analitiği yüklenemedi."));
  }, [days]);
  return <main className="mx-auto max-w-7xl space-y-6 pb-10">
    <div className="rounded-2xl bg-slate-950 p-7 text-white"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-blue-200">Satış performansı</p><h1 className="mt-1 text-3xl font-bold">Kampanya analitiği</h1><p className="mt-2 text-sm text-slate-300">Form, fiyat önizleme, sepet ve sipariş dönüşümlerini paket bazında takip edin.</p></div><select className="h-10 rounded-md border border-white/20 bg-white/10 px-3 text-sm" value={days} onChange={(event) => setDays(Number(event.target.value))}><option className="text-slate-900" value={7}>Son 7 gün</option><option className="text-slate-900" value={30}>Son 30 gün</option><option className="text-slate-900" value={90}>Son 90 gün</option></select></div></div>
    {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <Card className="overflow-hidden"><div className="border-b p-5"><div className="flex items-center gap-2"><BarChart3 className="size-5 text-blue-700" /><h2 className="font-bold">Paket performansı</h2></div></div><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Ürün / paket</th><th className="p-4 text-right">Görüntüleme</th><th className="p-4 text-right">Form</th><th className="p-4 text-right">Fiyat</th><th className="p-4 text-right">Sepet</th><th className="p-4 text-right">Sipariş</th><th className="p-4 text-right">Ciro</th></tr></thead><tbody>{items.length ? items.map((item) => <tr className="border-t" key={item.packageId}><td className="p-4"><b>{item.title}</b><p className="mt-1 text-xs text-slate-500">{item.productName}</p></td><td className="p-4 text-right">{number(item.events.view ?? 0)}</td><td className="p-4 text-right">{number(item.events.form_started ?? 0)}</td><td className="p-4 text-right">{number(item.events.quote_viewed ?? 0)}</td><td className="p-4 text-right">{number(item.events.add_to_cart ?? 0)}</td><td className="p-4 text-right"><span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><ShoppingCart className="size-3.5" />{number(item.orders)}</span></td><td className="p-4 text-right font-semibold"><span className="inline-flex items-center gap-1"><Wallet className="size-3.5" />{money(item.revenue)}</span></td></tr>) : <tr><td className="p-12 text-center text-slate-500" colSpan={7}>Bu dönem için kampanya verisi yok.</td></tr>}</tbody></table></div></Card>
  </main>;
}
