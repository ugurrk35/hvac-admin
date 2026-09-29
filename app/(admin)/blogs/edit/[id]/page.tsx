"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { blogCategoriesApi, blogPostsApi, fetchApi } from "@/lib/api";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!configuredApiUrl) throw new Error("NEXT_PUBLIC_API_URL tanımlı değil.");
const API_ORIGIN = new URL(configuredApiUrl).origin;

type LookupCategory = {
  id: number;
  name: string;
};

type BlogPostDetail = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishDate: string;
  isPublished: boolean;
  isFeatured: boolean;
  blogCategoryId: number;
  blogCategoryName: string;
  images: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  canonicalUrl: string;
  schemaJson: string;
};

export default function BlogPostEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id; // /blogs/edit/[id] gibi route kullanıyorsan buradan gelir

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [categories, setCategories] = useState<LookupCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [relatedIds, setRelatedIds] = useState<string>("");

  // GET blogpost by id
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await blogPostsApi.getDetail(String(id));
        setPost({
          ...data,
          images: data.images.map((img) => img.url), // veya img.path vs
        });
      } catch (err) {
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchApi<Array<{ productId: number }>>(
      `admin/AdminBlog/posts/${id}/products`,
    )
      .then((items) =>
        setRelatedIds(items.map((item) => item.productId).join(", ")),
      )
      .catch(() => undefined);
  }, [id]);

  // GET categories
  useEffect(() => {
    (async () => {
      try {
        const data = await blogCategoriesApi.getLookup();
        setCategories(data);
      } catch (e) {
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setLoading(true);
    try {
      const dto = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        blogCategoryId: post.blogCategoryId,
        publishDate: post.publishDate || new Date().toISOString(),
        isPublished: post.isPublished,
        isFeatured: post.isFeatured,
        tagIds: [],
        imageIds: [], // eğer image id’leri varsa buraya ekle
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        metaKeywords: post.metaKeywords,
        ogTitle: post.ogTitle,
        ogDescription: post.ogDescription,
        ogImageUrl: post.ogImageUrl,
        canonicalUrl: post.canonicalUrl,
        schemaJson: post.schemaJson,
      };

      if (!id) return;
      await blogPostsApi.update(Number(id), dto);
      const productIds = relatedIds
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0);
      await fetchApi(`admin/AdminBlog/posts/${id}/products`, {
        method: "PUT",
        body: JSON.stringify(productIds),
      });
      setMessage("Blog yazısı başarıyla güncellendi");
      router.push("/blogs");
    } catch (err) {
      setMessage("Güncelleme başarısız");
    } finally {
      setLoading(false);
    }
  };
  if (!post) return <p>Yükleniyor...</p>;

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Blog Yazısı Düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Sol sütun */}
            <div className="space-y-8">
              <div>
                <Label>Başlık</Label>
                <Input
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                />
              </div>
              <div>
                <Label>İçerik</Label>
                <RichTextEditor
                  value={post.content}
                  onChange={(val) => setPost({ ...post, content: val })}
                />
              </div>
            </div>

            {/* Sağ sütun */}
            <div className="space-y-2">
              <div>
                <Label>Slug</Label>
                <Input
                  value={post.slug}
                  onChange={(e) => setPost({ ...post, slug: e.target.value })}
                />
              </div>
              <div>
                <Label>Bağlı ürünler</Label>
                <Input
                  value={relatedIds}
                  onChange={(e) => setRelatedIds(e.target.value)}
                  placeholder="Ürün ID'leri: 12, 25, 37"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  En fazla 12 ürün; blog detayında öneri kartı olarak
                  gösterilir.
                </p>
              </div>
              <div>
                <Label>Kategori</Label>
                <Select
                  value={post.blogCategoryId?.toString()}
                  onValueChange={(val) =>
                    setPost({ ...post, blogCategoryId: Number(val) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kısa Açıklama</Label>
                <Textarea
                  value={post.excerpt}
                  onChange={(e) =>
                    setPost({ ...post, excerpt: e.target.value })
                  }
                />
              </div>

              <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer font-medium text-slate-900">SEO ve sosyal paylaşım</summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Meta başlık</Label>
                    <Input value={post.metaTitle || ""} maxLength={60} onChange={(e) => setPost({ ...post, metaTitle: e.target.value })} />
                  </div>
                  <div>
                    <Label>Meta açıklama</Label>
                    <Textarea value={post.metaDescription || ""} maxLength={160} onChange={(e) => setPost({ ...post, metaDescription: e.target.value })} />
                  </div>
                  <div>
                    <Label>Meta anahtar kelimeler</Label>
                    <Input value={post.metaKeywords || ""} onChange={(e) => setPost({ ...post, metaKeywords: e.target.value })} />
                  </div>
                  <div>
                    <Label>Canonical URL</Label>
                    <Input type="url" value={post.canonicalUrl || ""} onChange={(e) => setPost({ ...post, canonicalUrl: e.target.value })} />
                  </div>
                  <div>
                    <Label>Open Graph başlık</Label>
                    <Input value={post.ogTitle || ""} maxLength={60} onChange={(e) => setPost({ ...post, ogTitle: e.target.value })} />
                  </div>
                  <div>
                    <Label>Open Graph açıklama</Label>
                    <Textarea value={post.ogDescription || ""} maxLength={160} onChange={(e) => setPost({ ...post, ogDescription: e.target.value })} />
                  </div>
                  <div>
                    <Label>Open Graph görsel URL</Label>
                    <Input type="url" value={post.ogImageUrl || ""} onChange={(e) => setPost({ ...post, ogImageUrl: e.target.value })} />
                  </div>
                </div>
              </details>

              {post.images?.length > 0 && (
                <div>
                  <Image
                    src={`${API_ORIGIN}${post.images[0]}`}
                    alt="Kapak"
                    width={160}
                    height={160}
                    className="rounded mt-2 object-contain"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={post.isPublished}
                  onCheckedChange={(val) =>
                    setPost({ ...post, isPublished: val })
                  }
                />
                <Label>Yayınlansın mı?</Label>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </form>

          {message && (
            <p className="mt-4 text-center text-blue-600">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
