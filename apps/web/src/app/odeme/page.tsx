"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProductImage } from "@/app/product-image";
import { useCart } from "@/app/cart/cart-context";
import { apiFetch, apiUrl } from "@/lib/api";
import { formatPrice } from "@/app/products/product-data";
import { PROVINCES } from "@/lib/turkey-locations";
import { isValidPhone, sanitizePhoneInput } from "@/lib/phone";
import { Toast } from "@/app/toast";

function toTurkishError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("phone")) return "Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX).";
  if (m.includes("stock") || m.includes("unavailable") || m.includes("enough"))
    return "Üzgünüz, seçtiğiniz ürünlerden biri stokta tükendi. Lütfen sepetinizi kontrol ediniz.";
  if (m.includes("email")) return "Geçerli bir e-posta adresi giriniz.";
  if (m.includes("address")) return "Açık adres en az 10 karakter olmalıdır (mahalle, sokak, bina no...).";
  if (m.includes("city") || m.includes("district")) return "Lütfen il ve ilçe seçiniz.";
  if (m.includes("currency")) return "Sepetinizdeki ürünler farklı para birimleri içeriyor.";
  if (m.includes("items")) return "Sepetiniz boş görünüyor. Lütfen tekrar deneyin.";
  if (m.includes("name") || m.includes("required") || m.includes("between"))
    return "Lütfen tüm zorunlu alanları eksiksiz doldurunuz.";
  return "Bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.";
}

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
};

const emptyForm = { fullName: "", phone: "", city: "", district: "", address: "" };

type AppliedDiscount = { code: string; discountKurus: number };

export default function OdemePage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotalKurus, clearCart } = useCart();
  const router = useRouter();
  const currency = items[0]?.currency ?? "TRY";

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [newForm, setNewForm] = useState(emptyForm);
  const [placing, setPlacing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const totalKurus = subtotalKurus - (appliedDiscount?.discountKurus ?? 0);

  const selectedAddress = addresses.find((a) => a.id === selectedId);
  const selectedAddressInvalid = !!selectedAddress && !isValidPhone(selectedAddress.phone);

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const res = await fetch(`${apiUrl}/discount-codes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountInput, subtotalKurus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Geçersiz kod");
      setAppliedDiscount({ code: data.code, discountKurus: data.discountKurus });
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : "Geçersiz kod");
      setAppliedDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError(null);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/giris?redirect=/odeme");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !items.length) {
      router.push("/cart");
    }
  }, [items, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const list = await apiFetch<Address[]>("/customers/me/addresses", token);
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        setSelectedId(def?.id ?? "new");
      } catch {
        setSelectedId("new");
      }
    })();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    let shipping: typeof emptyForm;
    if (selectedId === "new") {
      shipping = newForm;
    } else {
      const addr = addresses.find((a) => a.id === selectedId)!;
      shipping = {
        fullName: addr.fullName,
        phone: addr.phone,
        city: addr.city,
        district: addr.district,
        address: addr.address,
      };
    }

    if (!shipping.fullName || shipping.fullName.trim().length < 2) {
      showToast("Ad soyad en az 2 karakter olmalıdır.");
      return;
    }

    if (!isValidPhone(shipping.phone)) {
      showToast("Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX).");
      return;
    }

    if (!shipping.city) {
      showToast("Lütfen il seçiniz.");
      return;
    }

    if (!shipping.district) {
      showToast("Lütfen ilçe seçiniz.");
      return;
    }

    if (shipping.address.trim().length < 10) {
      showToast("Açık adres en az 10 karakter olmalıdır (mahalle, sokak, bina no...).");
      return;
    }

    setPlacing(true);
    try {
      const token = await user.getIdToken();
      const order = await apiFetch<{ orderNumber: string }>("/orders", token, {
        method: "POST",
        body: JSON.stringify({
          shippingName: shipping.fullName,
          shippingPhone: shipping.phone,
          shippingCity: shipping.city,
          shippingDistrict: shipping.district,
          shippingAddress: shipping.address,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          ...(appliedDiscount && { discountCode: appliedDiscount.code }),
        }),
      });
      clearCart();
      router.push(`/siparis/${order.orderNumber}`);
    } catch (err) {
      showToast(toTurkishError(err instanceof Error ? err.message : ""));
    } finally {
      setPlacing(false);
    }
  }

  if (authLoading || selectedId === null) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
        </div>
      </main>
    );
  }

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="mb-8 border-b border-neutral-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
            Zenore
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ödeme</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Address section */}
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold">Teslimat Adresi</h2>

              {addresses.length > 0 && (
                <div className="flex flex-col gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-4 border p-4 transition ${
                        selectedId === addr.id
                          ? "border-neutral-950 bg-white"
                          : "border-neutral-200 bg-white hover:border-neutral-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedId === addr.id}
                        onChange={() => setSelectedId(addr.id)}
                        className="mt-0.5 accent-neutral-950"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{addr.fullName}</p>
                          {addr.label && (
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                              {addr.label}
                            </span>
                          )}
                          {addr.isDefault && (
                            <span className="rounded bg-neutral-950 px-2 py-0.5 text-xs font-medium text-white">
                              Varsayılan
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">{addr.phone}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {addr.address}, {addr.district}, {addr.city}
                        </p>
                        {!isValidPhone(addr.phone) && (
                          <p className="mt-2 text-xs font-medium text-red-600">
                            Bu adresin telefon numarası geçersiz. Devam etmeden önce{" "}
                            <Link href="/hesabim" className="underline underline-offset-2">
                              Adres Defteri&apos;nden
                            </Link>{" "}
                            güncelleyin veya farklı bir adres seçin.
                          </p>
                        )}
                      </div>
                    </label>
                  ))}

                  <label
                    className={`flex cursor-pointer items-center gap-4 border p-4 transition ${
                      selectedId === "new"
                        ? "border-neutral-950 bg-white"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value="new"
                      checked={selectedId === "new"}
                      onChange={() => setSelectedId("new")}
                      className="accent-neutral-950"
                    />
                    <span className="text-sm font-medium">Farklı adres kullan</span>
                  </label>
                </div>
              )}

              {(selectedId === "new" || addresses.length === 0) && (
                <div className="flex flex-col gap-4 border border-neutral-200 bg-white p-6">
                  {addresses.length === 0 && (
                    <p className="text-sm text-neutral-500">
                      Kayıtlı adresiniz yok. Teslimat adresinizi girin.
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        Ad Soyad <span className="text-red-500">*</span>
                      </label>
                      <input
                        required={selectedId === "new"}
                        type="text"
                        value={newForm.fullName}
                        onChange={(e) => setNewForm((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Ad Soyad"
                        className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        Telefon <span className="text-red-500">*</span>
                      </label>
                      <input
                        required={selectedId === "new"}
                        type="tel"
                        value={newForm.phone}
                        onChange={(e) => setNewForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))}
                        placeholder="0555 000 00 00"
                        className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        İl <span className="text-red-500">*</span>
                      </label>
                      <select
                        required={selectedId === "new"}
                        value={newForm.city}
                        onChange={(e) =>
                          setNewForm((p) => ({ ...p, city: e.target.value, district: "" }))
                        }
                        className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                      >
                        <option value="">İl Seçiniz</option>
                        {PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        İlçe <span className="text-red-500">*</span>
                      </label>
                      <select
                        required={selectedId === "new"}
                        value={newForm.district}
                        disabled={!newForm.city}
                        onChange={(e) =>
                          setNewForm((p) => ({ ...p, district: e.target.value }))
                        }
                        className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">İlçe Seçiniz</option>
                        {(PROVINCES.find((p) => p.name === newForm.city)?.districts ?? []).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">
                      Açık Adres <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required={selectedId === "new"}
                      rows={3}
                      value={newForm.address}
                      onChange={(e) => setNewForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Mahalle, sokak, bina no, daire..."
                      className="resize-none border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                    />
                    {newForm.address.length > 0 && newForm.address.length < 10 && (
                      <p className="text-xs text-amber-600">En az 10 karakter giriniz ({newForm.address.length}/10)</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside className="flex h-fit flex-col gap-4 border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Sipariş Özeti</h2>

              <div className="flex flex-col gap-3 border-b border-neutral-100 pb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-neutral-100 bg-stone-100">
                      <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium leading-5">{item.name}</p>
                      <p className="text-neutral-400">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.priceKurus * item.quantity, item.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Discount code */}
              <div className="border-b border-neutral-100 pb-4">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between gap-3 bg-emerald-50 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="font-medium text-emerald-800">{appliedDiscount.code}</span>
                      <span className="text-emerald-600">uygulandı</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                    >
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => {
                          setDiscountInput(e.target.value.toUpperCase());
                          setDiscountError(null);
                        }}
                        placeholder="İndirim kodu"
                        className="flex-1 border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm uppercase outline-none transition focus:border-neutral-950 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        disabled={discountLoading || !discountInput.trim()}
                        className="shrink-0 border border-neutral-950 px-4 py-2 text-xs font-medium text-neutral-950 transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {discountLoading ? "..." : "Uygula"}
                      </button>
                    </div>
                    {discountError && <p className="text-xs text-red-600">{discountError}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Ara Toplam</span>
                  <span className="font-medium">{formatPrice(subtotalKurus, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Kargo</span>
                  <span className="font-medium text-green-600">Ücretsiz</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">İndirim ({appliedDiscount.code})</span>
                    <span className="font-medium text-emerald-600">-{formatPrice(appliedDiscount.discountKurus, currency)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-t border-neutral-200 pt-4">
                <span className="font-semibold">Toplam</span>
                <span className="text-lg font-semibold">
                  {formatPrice(totalKurus, currency)}
                </span>
              </div>

              <button
                type="submit"
                disabled={placing || selectedAddressInvalid}
                className="flex h-12 items-center justify-center bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? "İşleniyor..." : "Siparişi Onayla"}
              </button>

              <p className="text-center text-xs text-neutral-400">
                Siparişi onaylayarak{" "}
                <span className="underline">kullanım koşullarını</span> kabul etmiş
                olursunuz.
              </p>
            </aside>
          </div>
        </form>
      </div>
    </main>
    </>
  );
}
