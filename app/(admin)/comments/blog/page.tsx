"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { BaseResponse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PagedResponse } from "@/app/interface/response";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Item = { id: number; blogId: number; name: string; email: string; comment: string; createdAt: string };
type Status = "pending" | "approved" | "rejected";

export default function AdminBlogCommentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async (nextPage: number, nextStatus: Status, nextQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", nextStatus);
      params.set("pageNumber", String(nextPage));
      params.set("pageSize", String(pageSize));
      if (nextQuery && nextQuery.trim()) params.set("q", nextQuery.trim());

      const res = await fetchApi<PagedResponse<Item>>(`/BlogComments?${params.toString()}`);
      setItems(res?.items ?? []);
      setTotalPages(res?.totalPages ?? 1);
      setTotalCount(res?.totalCount ?? (res?.items?.length ?? 0));
    } catch {
      setError("Yorumlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { load(1, status); }, [status, load]);

  async function approve(id: number) {
    setError(null);
    try {
      await fetchApi<BaseResponse>(`/BlogComments/${id}/approve`, { method: "POST" });
      load(page, status, query);
    } catch {
      setError("Onay işlemi başarısız oldu");
    }
  }

  async function reject(id: number) {
    setError(null);
    try {
      await fetchApi<BaseResponse>(`/BlogComments/${id}/reject`, { method: "POST" });
      load(page, status, query);
    } catch {
      setError("Reddetme işlemi başarısız oldu");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      String(i.id).includes(q) ||
      String(i.blogId).includes(q) ||
      (i.name ?? "").toLowerCase().includes(q) ||
      (i.email ?? "").toLowerCase().includes(q) ||
      (i.comment ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Blog Yorumları</h1>
          <p className="text-sm text-gray-500">Bekleyen yorumları görüntüleyin ve yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ara: ad, e-posta, içerik..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" onClick={() => { setPage(1); load(1, status, query); }} disabled={loading}>
            Yenile
          </Button>
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => { setStatus(v as Status); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="pending">Bekleyen</TabsTrigger>
          <TabsTrigger value="approved">Onaylı</TabsTrigger>
          <TabsTrigger value="rejected">Reddedilen</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-4">
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {loading ? (
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-40 w-full bg-gray-100 animate-pulse rounded" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">Bekleyen yorum bulunamadı.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Blog</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Yorum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.id}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">#{i.blogId}</Badge>
                  </TableCell>
                  <TableCell>{i.name || "Anonim"}</TableCell>
                  <TableCell>
                    {i.email ? (
                      <a href={`mailto:${i.email}`} className="text-blue-600 hover:underline">{i.email}</a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell title={i.comment}>
                    <span className="line-clamp-2 max-w-[420px] block">{i.comment}</span>
                  </TableCell>
                  <TableCell>{new Date(i.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => approve(i.id)}>Onayla</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setRejectId(i.id)}>Reddet</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu yorum reddedilecek ve listeden kaldÄ±rÄ±lacak. Bu iÅŸlem geri alÄ±namaz.
                            Bu yorum reddedilecek ve listeden kaldırılacak. Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { if (rejectId) reject(rejectId); setRejectId(null); }}>
                            Evet, reddet
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Toplam: {totalCount}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p, status, query); }}
              disabled={loading || page <= 1}
            >
              &Ouml;nceki
            </Button>
            <span>Sayfa {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p, status, query); }}
              disabled={loading || page >= totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

