"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProductAttribute } from "@/lib/types";
import { productAttributeApi } from "@/lib/api";

export default function EditVariantTypePage() {
  const router = useRouter();
  const params = useParams(); // ← useParams ile id alıyoruz
  const id = params?.id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalization, setIsPersonalization] = useState(false);
  const [formData, setFormData] = useState<ProductAttribute>({
    id: 0,
    name: "",
    isPersonalizationText: false,
    textPrompt: "",
    maxLength: 0,
    productAttributeValues: [],
  });

  useEffect(() => {
    if (!id) return;
    const fetchVariantType = async () => {
      try {
        setError(null);
        const response = await productAttributeApi.getProductAttribute(
          Number(id),
        );

        const attribute = response.data;
        if (!attribute) throw new Error("Varyant tipi bulunamadı");

        setFormData(attribute);
        setIsPersonalization(attribute.isPersonalizationText ?? false);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Varyant tipi yüklenirken bir hata oluştu",
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchVariantType();
  }, [id]);

  const addValue = () => {
    setFormData((prev) => ({
      ...prev,
      productAttributeValues: [
        ...prev.productAttributeValues,
        { value: "", priceModifier: 0 },
      ],
    }));
  };

  const updateValue = (
    index: number,
    field: "value" | "priceModifier",
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      productAttributeValues: prev.productAttributeValues.map((v, i) =>
        i === index ? { ...v, [field]: value } : v,
      ),
    }));
  };

  const removeValue = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      productAttributeValues: prev.productAttributeValues.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await productAttributeApi.updateProductAttribute(
        Number(params.id),
        formData,
      );
      if (response.success) {
        alert("Varyant tipi başarıyla güncellendi!");
        router.push("/variant-types");
      } else {
        throw new Error(response.message || "API yanıtı başarısız");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Varyant tipi güncellenirken bir hata oluştu",
      );
      alert(
        `Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalizationChange = (checked: boolean) => {
    setIsPersonalization(checked);
    setFormData((prev) => ({
      ...prev,
      isPersonalizationText: checked,
      // Kişiselleştirme seçildiğinde değerleri temizle
      productAttributeValues: checked ? [] : prev.productAttributeValues,
    }));
  };

  const isFormValid = () => {
    if (!formData.name) return false;

    if (formData.isPersonalizationText) {
      return (
        formData.textPrompt &&
        typeof formData.maxLength === "number" &&
        formData.maxLength > 0
      );
    } else {
      return (
        formData.productAttributeValues.length > 0 &&
        formData.productAttributeValues.every((v) => v.value)
      );
    }
  };

  if (initialLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-blue">
          Varyant Tipi Düzenle
        </h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Debug bilgileri */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium mb-2">Debug Bilgileri:</h3>
        <div className="text-sm space-y-1">
          <p>
            <strong>ID:</strong> {formData.id}
          </p>
          <p>
            <strong>Kişiselleştirme:</strong>{" "}
            {isPersonalization ? "✅ Evet" : "❌ Hayır"}
          </p>
          <p>
            <strong>Form Geçerli mi:</strong>{" "}
            {isFormValid() ? "✅ Evet" : "❌ Hayır"}
          </p>
          <p>
            <strong>Name:</strong> {formData.name || "Boş"}
          </p>
          {isPersonalization ? (
            <>
              <p>
                <strong>Metin İsteği:</strong> {formData.textPrompt || "Boş"}
              </p>
              <p>
                <strong>Maksimum Uzunluk:</strong> {formData.maxLength}
              </p>
            </>
          ) : (
            <p>
              <strong>Değer Sayısı:</strong>{" "}
              {formData.productAttributeValues.length}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Varyant Tipi Adı</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="border-palette-lightBlue"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPersonalizationText"
                checked={isPersonalization}
                onCheckedChange={handlePersonalizationChange}
              />
              <Label htmlFor="isPersonalizationText">
                Kişiselleştirme Metni
              </Label>
            </div>

            {isPersonalization ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="textPrompt">Metin İsteği</Label>
                  <Textarea
                    id="textPrompt"
                    value={formData.textPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        textPrompt: e.target.value,
                      }))
                    }
                    className="min-h-[100px] border-palette-lightBlue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLength">Maksimum Karakter Sayısı</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    min="1"
                    value={formData.maxLength}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxLength: Number(e.target.value),
                      }))
                    }
                    className="border-palette-lightBlue"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Varyant Değerleri</h3>
                  <Button
                    type="button"
                    onClick={addValue}
                    variant="outline"
                    className="border-palette-lightBlue hover:bg-palette-lightBlue/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Değer Ekle
                  </Button>
                </div>

                {formData.productAttributeValues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p>Henüz değer eklenmedi.</p>
                    <p className="text-sm mt-1">
                      Örneğin &quot;Renk&quot; varyant tipi için
                      &quot;Kırmızı&quot;, &quot;Mavi&quot;, &quot;Yeşil&quot;
                      gibi değerler ekleyebilirsiniz.
                    </p>
                    <Button
                      type="button"
                      onClick={addValue}
                      variant="outline"
                      className="mt-4 border-palette-lightBlue hover:bg-palette-lightBlue/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      İlk Değeri Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.productAttributeValues.map((value, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input
                            value={value.value}
                            onChange={(e) =>
                              updateValue(index, "value", e.target.value)
                            }
                            className="border-palette-lightBlue"
                            placeholder={`Değer ${index + 1}`}
                            required
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            value={value.priceModifier}
                            onChange={(e) =>
                              updateValue(
                                index,
                                "priceModifier",
                                Number(e.target.value),
                              )
                            }
                            className="border-palette-lightBlue"
                            placeholder="Fiyat Farkı"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-100"
                          onClick={() => removeValue(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              className="bg-black hover:bg-palette-white hover:text-black"
            >
              {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Network İstekleri için Bilgi */}
      <Card className="p-4 bg-blue-50">
        <h3 className="font-medium mb-2">
          🌐 Network İsteklerini Kontrol Etmek İçin:
        </h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>F12 tuşuna basarak Developer Tools&apos;u açın</li>
          <li>&quot;Network&quot; sekmesine gidin</li>
          <li>
            Formu düzenleyip &quot;Değişiklikleri Kaydet&quot; butonuna tıklayın
          </li>
          <li>
            Network sekmesinde &quot;ProductAttribute/{params.id}&quot; isteğini
            bulun
          </li>
          <li>İsteğin durumunu (Status), yanıtını (Response) kontrol edin</li>
        </ol>
      </Card>
    </div>
  );
}
