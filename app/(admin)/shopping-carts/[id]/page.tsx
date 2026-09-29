"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { shoppingCartApi } from "@/lib/api";
import { ShoppingCartTypeDtails } from "@/lib/types";



export default function ShoppingCartDetailPage() {

const params = useParams();
const idParam = params?.id; // string | string[]

// id'yi güvenli şekilde number'a çevir
const id = Array.isArray(idParam) ? Number(idParam[0]) : Number(idParam);

  const [cart, setCart] = useState<ShoppingCartTypeDtails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!id) return;

  const fetchCart = async () => {
    setLoading(true);
     const res = await shoppingCartApi.getCartById(
      Array.isArray(id) ? Number(id[0]) : Number(id)
    );
    if (res.success && res.data) {
      setCart(res.data);
      setError(null);
    } else {
      setError(res.message || "Sepet bulunamadı");
    }
    setLoading(false);
  };

  fetchCart();
}, [id]);


  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/shopping-carts">
          <Button variant="outline">← Sepetler</Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" /> Sepet Detayı
        </h1>
      </div>
      {loading ? (
        <div>Yükleniyor...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : cart ? (
        <div>
          <div className="mb-4">
            <div><b>ID:</b> {cart.id}</div>
            <div><b>Kullanıcı:</b> {cart.user ? `${cart.user.firstName} ${cart.user.lastName} (${cart.user.email})` : cart.guestIdentifier || "-"}</div>
            <div><b>Toplam Tutar:</b> {cart.totalAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</div>
            <div><b>Durum:</b> {cart.isOrdered ? "Siparişe Dönüştü" : "Aktif"}</div>
            <div><b>Oluşturulma:</b> {new Date(cart.createdAt).toLocaleString()}</div>
            <div><b>Güncelleme:</b> {new Date(cart.lastModifiedAt).toLocaleString()}</div>
          </div>
          <h2 className="text-lg font-semibold mb-2">Ürünler</h2>
          {cart.cartItems && cart.cartItems.length > 0 ? (
            <table className="min-w-full border text-sm mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Ürün Adı</th>
                  <th className="p-2 border">Adet</th>
                  <th className="p-2 border">Birim Fiyat</th>
                  <th className="p-2 border">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {cart.cartItems.map((item) => (
                  <tr key={item.productId}>
                    <td className="p-2 border">{item.productName}</td>
                    <td className="p-2 border">{item.quantity}</td>
                    <td className="p-2 border">{item.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                    <td className="p-2 border">{item.totalPrice.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>Sepette ürün yok.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
