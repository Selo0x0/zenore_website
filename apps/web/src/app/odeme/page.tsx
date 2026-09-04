"use client";

import { useEffect, useRef, useState } from "react";
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
import { LocationSelect } from "@/app/location-select";

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

const emptyForm = { fullName: "", email: "", phone: "", city: "", district: "", address: "" };

type AppliedDiscount = { code: string; discountKurus: number };
type FirstOrderOffer = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderKurus: number | null;
};

type ShippingSettings = {
  feeKurus: number;
  freeShippingThresholdKurus: number;
  isActive: boolean;
};

const defaultShippingSettings: ShippingSettings = {
  feeKurus: 15000,
  freeShippingThresholdKurus: 200000,
  isActive: true,
};

export default function OdemePage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotalKurus, clearCart } = useCart();
  const router = useRouter();
  const currency = items[0]?.currency ?? "TRY";

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [newForm, setNewForm] = useState(emptyForm);
  const [placing, setPlacing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const orderPlacedRef = useRef(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [firstOrderOffer, setFirstOrderOffer] = useState<FirstOrderOffer | null>(null);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(
    defaultShippingSettings,
  );

  const shippingKurus =
    shippingSettings.isActive &&
    subtotalKurus < shippingSettings.freeShippingThresholdKurus
      ? shippingSettings.feeKurus
      : 0;
  const totalKurus =
    subtotalKurus + shippingKurus - (appliedDiscount?.discountKurus ?? 0);

  const selectedAddress = addresses.find((a) => a.id === selectedId);
  const selectedAddressInvalid = !!selectedAddress && !isValidPhone(selectedAddress.phone);

  async function applyDiscount(codeOverride?: string) {
    const code = (codeOverride ?? discountInput).trim().toUpperCase();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch(`${apiUrl}/discount-codes/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code, subtotalKurus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Geçersiz kod");
      setAppliedDiscount({ code: data.code, discountKurus: data.discountKurus });
      setDiscountInput(data.code);
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

  useEffect(() => {
    if (authLoading) return;

    (async () => {
      try {
        const token = user ? await user.getIdToken() : null;
        const [offerRes, shippingRes] = await Promise.all([
          fetch(`${apiUrl}/discount-codes/first-order-offer`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store",
          }),
          fetch(`${apiUrl}/shipping-settings`, { cache: "no-store" }),
        ]);
        if (offerRes.ok) {
          const data = (await offerRes.json()) as FirstOrderOffer | null;
          setFirstOrderOffer(data);
        }
        if (shippingRes.ok) {
          const settings = (await shippingRes.json()) as ShippingSettings;
          setShippingSettings(settings);
        }
      } catch {
        // Campaign/shipping previews are nice-to-have; order creation remains authoritative.
      }
    })();
  }, [user, authLoading]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }

  useEffect(() => {
    if (!authLoading && !items.length && !orderPlacedRef.current) {
      router.push("/cart");
    }
  }, [items, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
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
  }, [user, authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let shipping: typeof emptyForm;
    if (selectedId === "new") {
      shipping = {
        ...newForm,
        email: newForm.email || user?.email || "",
      };
    } else {
      const addr = addresses.find((a) => a.id === selectedId)!;
      shipping = {
        fullName: addr.fullName,
        email: user?.email ?? "",
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

    const email = shipping.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Geçerli bir e-posta adresi giriniz.");
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
      const token = user ? await user.getIdToken() : undefined;
      const order = await apiFetch<{ orderNumber: string }>("/orders", token, {
        method: "POST",
        body: JSON.stringify({
          customerName: shipping.fullName,
          customerEmail: email,
          customerPhone: shipping.phone,
          shippingName: shipping.fullName,
          shippingPhone: shipping.phone,
          shippingCity: shipping.city,
          shippingDistrict: shipping.district,
          shippingAddress: shipping.address,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          ...(appliedDiscount && { discountCode: appliedDiscount.code }),
        }),
      });
      orderPlacedRef.current = true;
      clearCart();
      router.push(`/odeme/${order.orderNumber}`);
    } catch (err) {
      showToast(toTurkishError(err instanceof Error ? err.message : ""));
    } finally {
      setPlacing(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
        </div>
      </main>
    );
  }

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="mb-8 border-b border-brown-muted/15 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-brown-muted">
            Zenore
          </p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink">Ödeme</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Address section */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-serif text-lg text-ink">Teslimat Bilgileri</h2>
                {!user && (
                  <p className="mt-1 text-sm text-brown-muted">
                    Üye olmadan devam edebilirsiniz. Sipariş bilgileri e-posta adresinize gönderilir.
                  </p>
                )}
              </div>

              {addresses.length > 0 && (
                <div className="flex flex-col gap-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-4 border p-4 transition ${
                        selectedId === addr.id
                          ? "border-rust-dark bg-cream-soft"
                          : "border-brown-muted/15 bg-cream-soft hover:border-brown-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedId === addr.id}
                        onChange={() => setSelectedId(addr.id)}
                        className="mt-0.5 accent-rust"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-ink">{addr.fullName}</p>
                          {addr.label && (
                            <span className="rounded bg-cream px-2 py-0.5 text-xs font-medium text-brown-muted">
                              {addr.label}
                            </span>
                          )}
                          {addr.isDefault && (
                            <span className="rounded bg-rust px-2 py-0.5 text-xs font-medium text-cream">
                              Varsayılan
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-brown-muted">{addr.phone}</p>
                        <p className="mt-1 text-sm text-brown">
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
                        ? "border-rust-dark bg-cream-soft"
                        : "border-brown-muted/15 bg-cream-soft hover:border-brown-muted/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value="new"
                      checked={selectedId === "new"}
                      onChange={() => setSelectedId("new")}
                      className="accent-rust"
                    />
                    <span className="text-sm font-medium text-ink">Farklı adres kullan</span>
                  </label>
                </div>
              )}

              {(selectedId === "new" || addresses.length === 0) && (
                <div className="flex flex-col gap-4 border border-brown-muted/15 bg-cream-soft p-6">
                  {addresses.length === 0 && (
                    <p className="text-sm text-brown-muted">
                      Kayıtlı adresiniz yok. Teslimat adresinizi girin.
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-brown">
                        Ad Soyad <span className="text-red-500">*</span>
                      </label>
                      <input
                        required={selectedId === "new"}
                        type="text"
                        value={newForm.fullName}
                        onChange={(e) => setNewForm((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Ad Soyad"
                        className="border border-brown-muted/20 bg-cream px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-brown">
                        E-posta <span className="text-red-500">*</span>
                      </label>
                      <input
                        required={selectedId === "new"}
                        type="email"
                        value={newForm.email || user?.email || ""}
                        onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="ornek@email.com"
                        className="border border-brown-muted/20 bg-cream px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-brown">
                        Telefon <span className="text-red-500">*</span>
                      </label>
                      <input
                        required={selectedId === "new"}
                        type="tel"
                        value={newForm.phone}
                        onChange={(e) => setNewForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))}
                        placeholder="0555 000 00 00"
                        className="border border-brown-muted/20 bg-cream px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-brown">
                        İl <span className="text-red-500">*</span>
                      </label>
                      <LocationSelect
                        value={newForm.city}
                        onChange={(city) => setNewForm((p) => ({ ...p, city, district: "" }))}
                        options={PROVINCES.map((p) => p.name)}
                        placeholder="İl Seçiniz"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-brown">
                        İlçe <span className="text-red-500">*</span>
                      </label>
                      <LocationSelect
                        value={newForm.district}
                        onChange={(district) => setNewForm((p) => ({ ...p, district }))}
                        options={PROVINCES.find((p) => p.name === newForm.city)?.districts ?? []}
                        placeholder="İlçe Seçiniz"
                        disabled={!newForm.city}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-brown">
                      Açık Adres <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required={selectedId === "new"}
                      rows={3}
                      value={newForm.address}
                      onChange={(e) => setNewForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Mahalle, sokak, bina no, daire..."
                      className="resize-none border border-brown-muted/20 bg-cream px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft"
                    />
                    {newForm.address.length > 0 && newForm.address.length < 10 && (
                      <p className="text-xs text-amber-600">En az 10 karakter giriniz ({newForm.address.length}/10)</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside className="flex h-fit flex-col gap-4 border border-brown-muted/15 bg-cream-soft p-6">
              <h2 className="font-serif text-lg text-ink">Sipariş Özeti</h2>

              <div className="flex flex-col gap-3 border-b border-brown-muted/15 pb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-brown-muted/15 bg-cream">
                      <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium leading-5 text-ink">{item.name}</p>
                      <p className="text-brown-muted">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {formatPrice(item.priceKurus * item.quantity, item.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Discount code */}
              <div className="border-b border-brown-muted/15 pb-4">
                {firstOrderOffer && !appliedDiscount && (
                  <div className="mb-3 border border-rust/20 bg-cream px-3 py-3">
                    <p className="text-sm font-medium text-ink">
                      İlk siparişe özel{" "}
                      {firstOrderOffer.type === "PERCENTAGE"
                        ? `%${firstOrderOffer.value}`
                        : formatPrice(firstOrderOffer.value, currency)}{" "}
                      indirim
                    </p>
                    <p className="mt-1 text-xs leading-5 text-brown-muted">
                      Bu kampanya giriş yapan müşterilerin ilk siparişinde geçerlidir.
                    </p>
                    {user ? (
                      <button
                        type="button"
                        onClick={() => applyDiscount(firstOrderOffer.code)}
                        disabled={discountLoading}
                        className="mt-3 text-xs font-semibold text-rust-dark underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {discountLoading ? "Uygulanıyor..." : "İlk sipariş indirimini uygula"}
                      </button>
                    ) : (
                      <div className="mt-3 flex gap-3 text-xs font-semibold">
                        <Link
                          href="/giris?redirect=/odeme"
                          className="text-rust-dark underline underline-offset-4"
                        >
                          Giriş yap
                        </Link>
                        <Link
                          href="/kayit?redirect=/odeme"
                          className="text-rust-dark underline underline-offset-4"
                        >
                          Üye ol
                        </Link>
                      </div>
                    )}
                  </div>
                )}
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
                        className="flex-1 border border-brown-muted/20 bg-cream px-3 py-2 text-sm uppercase text-ink outline-none transition focus:border-rust focus:bg-cream-soft"
                      />
                      <button
                        type="button"
                        onClick={() => applyDiscount()}
                        disabled={discountLoading || !discountInput.trim()}
                        className="shrink-0 border border-rust-dark px-4 py-2 text-xs font-medium text-rust-dark transition hover:bg-rust-dark hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
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
                  <span className="text-brown-muted">Ara Toplam</span>
                  <span className="font-medium text-ink">{formatPrice(subtotalKurus, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brown-muted">Kargo</span>
                  <span className={shippingKurus > 0 ? "font-medium text-ink" : "font-medium text-green-600"}>
                    {shippingKurus > 0 ? formatPrice(shippingKurus, currency) : "Ücretsiz"}
                  </span>
                </div>
                {shippingSettings.isActive && shippingKurus > 0 && (
                  <p className="text-xs leading-5 text-brown-muted">
                    {formatPrice(shippingSettings.freeShippingThresholdKurus, currency)} ve üzeri ücretsiz kargo.
                  </p>
                )}
                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span className="text-brown-muted">İndirim ({appliedDiscount.code})</span>
                    <span className="font-medium text-emerald-600">-{formatPrice(appliedDiscount.discountKurus, currency)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-t border-brown-muted/15 pt-4">
                <span className="font-semibold text-ink">Toplam</span>
                <span className="text-lg font-semibold text-ink">
                  {formatPrice(totalKurus, currency)}
                </span>
              </div>

              <button
                type="submit"
                disabled={placing || selectedAddressInvalid}
                className="flex h-12 items-center justify-center bg-rust text-sm font-semibold text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing ? "İşleniyor..." : "Siparişi Onayla"}
              </button>

              <p className="text-center text-xs text-brown-muted">
                Siparişi onaylayarak{" "}
                <Link
                  href="/kullanim-kosullari"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-rust-dark"
                >
                  kullanım koşullarını
                </Link>{" "}
                kabul etmiş olursunuz.
              </p>
            </aside>
          </div>
        </form>
      </div>
    </main>
    </>
  );
}
