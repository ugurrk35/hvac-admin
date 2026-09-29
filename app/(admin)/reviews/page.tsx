"use client";

import { useCallback, useEffect, useState } from "react";
import { reviewsAdminApi } from "@/lib/api";
import type { AdminReviewListItem } from "@/lib/types";

export default function ReviewsModerationPage() {
  type FilterType = "all" | "pending" | "approved";
  const [items, setItems] = useState<AdminReviewListItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("pending");

  const refresh = useCallback(async () => {
    const res = await reviewsAdminApi.list(filter === "all" ? undefined : filter);
    if (res.success) setItems(res.data || []);
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function approve(id: number) {
    await reviewsAdminApi.approve(id);
    await refresh();
  }
  async function remove(id: number) {
    await reviewsAdminApi.delete(id);
    await refresh();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Yorum Yönetimi</h1>
        <select
          className="border px-2 py-1"
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setFilter(e.target.value as FilterType)
          }
        >
          <option value="pending">Bekleyen</option>
          <option value="approved">Onaylı</option>
          <option value="all">Tümü</option>
        </select>
      </div>
      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id} className="border rounded p-4">
            <div className="text-sm text-gray-600">Ürün ID: {r.productId}</div>
            <div className="font-medium">{r.title}</div>
            <div className="text-yellow-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <p className="text-gray-700 mt-1">{r.content}</p>
            <div className="mt-2 flex gap-2">
              {!r.isApproved && (
                <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => approve(r.id)}>Onayla</button>
              )}
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => remove(r.id)}>Sil</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p>Kayıt bulunamadı.</p>}
      </div>
    </div>
  );
}
