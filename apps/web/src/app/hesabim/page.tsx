"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiUrl, apiFetch } from "@/lib/api";
import { PROVINCES } from "@/lib/turkey-locations";
import { isValidPhone, sanitizePhoneInput } from "@/lib/phone";
import { Toast } from "@/app/toast";
import { ProductImage } from "@/app/product-image";
import { formatPrice } from "@/app/products/product-data";
import { useFavorites } from "@/app/favoriler/favorites-context";
import { FavoriteButton } from "@/app/favoriler/favorite-button";

type Customer = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  createdAt: string;
};

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

type Tab = "account" | "addresses" | "orders" | "favorites";

type OrderItem = {
  id: string;
  productName: string;
  productSlug: string;
  unitPriceKurus: number;
  quantity: number;
  lineTotalKurus: number;
  productImageUrl: string | null;
  productImageAlt: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  currency: string;
  subtotalKurus: number;
  shippingKurus: number;
  discountCode: string | null;
  discountKurus: number;
  totalKurus: number;
  createdAt: string;
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingAddress: string;
  items: OrderItem[];
};

const STATUS_LABELS: Record<Order["status"], string> = {
  PENDING: "Sipariş Alındı",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] as const;

function statusBadgeClass(status: Order["status"]) {
  switch (status) {
    case "PENDING":   return "bg-amber-50 text-amber-700 border border-amber-200";
    case "CONFIRMED": return "bg-blue-50 text-blue-700 border border-blue-200";
    case "PREPARING": return "bg-orange-50 text-orange-700 border border-orange-200";
    case "SHIPPED":   return "bg-purple-50 text-purple-700 border border-purple-200";
    case "DELIVERED": return "bg-green-50 text-green-700 border border-green-200";
    case "CANCELLED": return "bg-red-50 text-red-700 border border-red-200";
  }
}

const emptyAddressForm = {
  label: "",
  fullName: "",
  phone: "",
  city: "",
  district: "",
  address: "",
  isDefault: false,
};

export default function HesabimPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { favorites } = useFavorites();

  const [tab, setTab] = useState<Tab>("account");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Account form
  const [accountForm, setAccountForm] = useState({ displayName: "", phone: "" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Address UI
  const [addressView, setAddressView] = useState<"list" | "form">("list");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }

  async function loadOrders() {
    if (!user || ordersLoaded) return;
    setOrdersLoading(true);
    try {
      const token = await user.getIdToken();
      const data = await apiFetch<Order[]>("/customers/me/orders", token);
      setOrders(data);
      setOrdersLoaded(true);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/giris?redirect=/hesabim");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        let c: Customer;
        try {
          c = await apiFetch<Customer>("/customers/me", token);
        } catch {
          // No matching customer record — create it now (self-heal for orphaned accounts)
          c = await apiFetch<Customer>("/customers/me", token, {
            method: "POST",
            body: JSON.stringify({ displayName: user.displayName ?? undefined }),
          });
        }
        const a = await apiFetch<Address[]>("/customers/me/addresses", token);
        setCustomer(c);
        setAddresses(a);
        setAccountForm({ displayName: c.displayName ?? "", phone: c.phone ?? "" });
        setLoadError(false);
      } catch {
        setLoadError(true);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (accountForm.phone.trim() && !isValidPhone(accountForm.phone)) {
      showToast("Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX).");
      return;
    }

    setAccountSaving(true);
    try {
      const token = await user.getIdToken();
      const updated = await apiFetch<Customer>("/customers/me", token, {
        method: "PATCH",
        body: JSON.stringify(accountForm),
      });
      setCustomer(updated);
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 3000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setAccountSaving(false);
    }
  }

  function openAddForm() {
    setEditingAddress(null);
    setAddressForm(emptyAddressForm);
    setAddressView("form");
  }

  function openEditForm(addr: Address) {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label ?? "",
      fullName: addr.fullName,
      phone: addr.phone,
      city: addr.city,
      district: addr.district,
      address: addr.address,
      isDefault: addr.isDefault,
    });
    setAddressView("form");
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!isValidPhone(addressForm.phone)) {
      showToast("Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX).");
      return;
    }

    setAddressSaving(true);
    try {
      const token = await user.getIdToken();
      if (editingAddress) {
        const updated = await apiFetch<Address>(
          `/customers/me/addresses/${editingAddress.id}`,
          token,
          { method: "PATCH", body: JSON.stringify(addressForm) },
        );
        setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await apiFetch<Address>("/customers/me/addresses", token, {
          method: "POST",
          body: JSON.stringify(addressForm),
        });
        setAddresses((prev) => [...prev, created]);
      }
      setAddressView("list");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Adres kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!user) return;
    const token = await user.getIdToken();
    await apiFetch(`/customers/me/addresses/${addressId}`, token, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== addressId));
  }

  async function handleSetDefault(addressId: string) {
    if (!user) return;
    const token = await user.getIdToken();
    await apiFetch(`/customers/me/addresses/${addressId}/default`, token, {
      method: "PATCH",
    });
    setAddresses((prev) =>
      prev
        .map((a) => ({ ...a, isDefault: a.id === addressId }))
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    );
  }

  if (authLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (loadError || !customer) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-5 py-32 text-center">
          <p className="text-sm text-neutral-500">
            Hesap bilgileriniz yüklenemedi. Lütfen tekrar deneyin.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-10 bg-neutral-950 px-6 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Tekrar Dene
          </button>
        </div>
      </main>
    );
  }

  const displayName = customer.displayName ?? customer.email;
  const firstName = displayName.split(" ")[0];
  const initial = firstName[0]?.toUpperCase() ?? "?";
  const memberSince = new Date(customer.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  });

  const navItems: { key: Tab; label: string }[] = [
    { key: "account", label: "Hesap Bilgileri" },
    { key: "addresses", label: "Adres Defteri" },
    { key: "orders", label: "Siparişlerim" },
    { key: "favorites", label: "Favorilerim" },
  ];

  return (
    <>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        {/* Page header */}
        <div className="mb-8 border-b border-neutral-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
            Hesabım
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Merhaba, {firstName}
          </h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Sidebar */}
          <aside className="lg:w-60 lg:shrink-0">
            <div className="border border-neutral-200 bg-white p-6">
              <div className="flex flex-col items-center gap-3 border-b border-neutral-100 pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-2xl font-semibold text-white">
                  {initial}
                </div>
                <div className="text-center">
                  <p className="font-semibold">{displayName}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{customer.email}</p>
                  <p className="mt-1 text-xs text-neutral-400">Üye: {memberSince}</p>
                </div>
              </div>

              <nav className="mt-4 flex flex-col gap-1">
                {navItems.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTab(key);
                      setAddressView("list");
                      setSelectedOrder(null);
                      if (key === "orders") loadOrders();
                    }}
                    className={`rounded-sm px-3 py-2.5 text-left text-sm font-medium transition ${
                      tab === key
                        ? "bg-neutral-950 text-white"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* ACCOUNT TAB */}
            {tab === "account" && (
              <div className="border border-neutral-200 bg-white p-6 sm:p-8">
                <h2 className="mb-6 text-lg font-semibold">Hesap Bilgileri</h2>
                <form onSubmit={saveAccount} className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        value={accountForm.displayName}
                        onChange={(e) =>
                          setAccountForm((p) => ({ ...p, displayName: e.target.value }))
                        }
                        placeholder="Ad Soyad"
                        className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        E-posta
                      </label>
                      <input
                        type="email"
                        value={customer.email}
                        readOnly
                        className="border border-neutral-100 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-400 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-neutral-700">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={accountForm.phone}
                        onChange={(e) =>
                          setAccountForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))
                        }
                        placeholder="0555 000 00 00"
                        className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-neutral-100 pt-4">
                    <button
                      type="submit"
                      disabled={accountSaving}
                      className="bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {accountSaving ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                    {accountSaved && (
                      <p className="text-sm font-medium text-green-600">
                        Bilgiler güncellendi.
                      </p>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {tab === "addresses" && (
              <div className="border border-neutral-200 bg-white p-6 sm:p-8">
                {addressView === "list" ? (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Adres Defteri</h2>
                      <button
                        type="button"
                        onClick={openAddForm}
                        className="bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                      >
                        + Yeni Adres Ekle
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="flex flex-col items-center gap-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                          <svg
                            className="h-7 w-7 text-neutral-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-700">
                            Kayıtlı adresiniz yok
                          </p>
                          <p className="mt-1 text-sm text-neutral-400">
                            Hızlı alışveriş için adreslerinizi kaydedin.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openAddForm}
                          className="mt-2 border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
                        >
                          İlk Adresinizi Ekleyin
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={`relative flex flex-col gap-3 border p-5 ${
                              addr.isDefault
                                ? "border-neutral-950"
                                : "border-neutral-200"
                            }`}
                          >
                            {addr.isDefault && (
                              <span className="absolute right-4 top-4 bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                                Varsayılan
                              </span>
                            )}
                            <div>
                              {addr.label && (
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                  {addr.label}
                                </p>
                              )}
                              <p className="font-medium">{addr.fullName}</p>
                              <p className="mt-1 text-sm text-neutral-500">{addr.phone}</p>
                              <p className="mt-2 text-sm leading-6 text-neutral-600">
                                {addr.address}, {addr.district}, {addr.city}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 border-t border-neutral-100 pt-3 text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => openEditForm(addr)}
                                className="text-neutral-500 transition hover:text-neutral-950"
                              >
                                Düzenle
                              </button>
                              {!addr.isDefault && (
                                <>
                                  <span className="text-neutral-200">|</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefault(addr.id)}
                                    className="text-neutral-500 transition hover:text-neutral-950"
                                  >
                                    Varsayılan Yap
                                  </button>
                                </>
                              )}
                              <span className="text-neutral-200">|</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-red-500 transition hover:text-red-700"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Address form */
                  <>
                    <div className="mb-6 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setAddressView("list")}
                        className="text-sm text-neutral-400 transition hover:text-neutral-950"
                      >
                        ← Geri
                      </button>
                      <h2 className="text-lg font-semibold">
                        {editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}
                      </h2>
                    </div>
                    <form onSubmit={saveAddress} className="flex flex-col gap-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-neutral-700">
                            Adres Başlığı{" "}
                            <span className="font-normal text-neutral-400">
                              (opsiyonel)
                            </span>
                          </label>
                          <input
                            type="text"
                            value={addressForm.label}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, label: e.target.value }))
                            }
                            placeholder="Ev, İş..."
                            className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-neutral-700">
                            Ad Soyad <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={addressForm.fullName}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, fullName: e.target.value }))
                            }
                            placeholder="Ad Soyad"
                            className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-neutral-700">
                            Telefon <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={addressForm.phone}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, phone: sanitizePhoneInput(e.target.value) }))
                            }
                            placeholder="0555 000 00 00"
                            className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-neutral-700">
                            İl <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, city: e.target.value, district: "" }))
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
                            required
                            value={addressForm.district}
                            disabled={!addressForm.city}
                            onChange={(e) =>
                              setAddressForm((p) => ({ ...p, district: e.target.value }))
                            }
                            className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">İlçe Seçiniz</option>
                            {(PROVINCES.find((p) => p.name === addressForm.city)?.districts ?? []).map((d) => (
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
                          required
                          rows={3}
                          value={addressForm.address}
                          onChange={(e) =>
                            setAddressForm((p) => ({ ...p, address: e.target.value }))
                          }
                          placeholder="Mahalle, sokak, bina no, daire..."
                          className="resize-none border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                        />
                      </div>

                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) =>
                            setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))
                          }
                          className="h-4 w-4 accent-neutral-950"
                        />
                        <span className="text-sm text-neutral-700">
                          Varsayılan adres olarak kaydet
                        </span>
                      </label>

                      <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
                        <button
                          type="submit"
                          disabled={addressSaving}
                          className="bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
                        >
                          {addressSaving ? "Kaydediliyor..." : "Adresi Kaydet"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressView("list")}
                          className="px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {tab === "orders" && (
              <div className="border border-neutral-200 bg-white p-6 sm:p-8">
                {selectedOrder ? (
                  /* ── ORDER DETAIL ── */
                  <>
                    <div className="mb-6 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="text-sm text-neutral-400 transition hover:text-neutral-950"
                      >
                        ← Siparişlerime Dön
                      </button>
                    </div>

                    <div className="mb-6">
                      <p className="font-mono text-sm font-semibold text-neutral-700">
                        {selectedOrder.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {new Date(selectedOrder.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {selectedOrder.status === "CANCELLED" ? (
                      <div className="mb-8 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3">
                        <span className="text-sm font-medium text-red-700">
                          Bu sipariş iptal edildi.
                        </span>
                      </div>
                    ) : (
                      <div className="mb-8 overflow-x-auto pb-2">
                        <div className="flex min-w-[380px] items-start">
                          {STATUS_STEPS.map((step, i) => {
                            const currentIdx = (STATUS_STEPS as readonly string[]).indexOf(
                              selectedOrder.status,
                            );
                            const isReached = i <= currentIdx;
                            const isLast = i === STATUS_STEPS.length - 1;
                            return (
                              <div key={step} className="flex flex-1 flex-col items-center">
                                <div className="flex w-full items-center">
                                  {i === 0 ? (
                                    <div className="flex-1" />
                                  ) : (
                                    <div
                                      className={`h-px flex-1 transition-colors ${isReached ? "bg-neutral-950" : "bg-neutral-200"}`}
                                    />
                                  )}
                                  <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                                      isReached
                                        ? "border-neutral-950 bg-neutral-950"
                                        : "border-neutral-200 bg-white"
                                    }`}
                                  >
                                    {isReached && (
                                      <svg
                                        className="h-3.5 w-3.5 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>
                                  {isLast ? (
                                    <div className="flex-1" />
                                  ) : (
                                    <div
                                      className={`h-px flex-1 transition-colors ${i < currentIdx ? "bg-neutral-950" : "bg-neutral-200"}`}
                                    />
                                  )}
                                </div>
                                <p
                                  className={`mt-2 text-center text-[10px] leading-tight ${
                                    isReached ? "font-semibold text-neutral-950" : "text-neutral-400"
                                  }`}
                                >
                                  {STATUS_LABELS[step]}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="mb-6">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        Ürünler
                      </h3>
                      <div className="flex flex-col gap-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-neutral-100">
                              {item.productImageUrl ? (
                                <ProductImage
                                  src={`${apiUrl}/images/products/${item.productImageUrl}`}
                                  alt={item.productImageAlt ?? item.productName}
                                />
                              ) : (
                                <div className="h-full w-full bg-neutral-100" />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                              <p className="truncate text-sm font-medium">{item.productName}</p>
                              <p className="text-xs text-neutral-400">
                                {item.quantity} adet ×{" "}
                                {formatPrice(item.unitPriceKurus, selectedOrder.currency)}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold">
                              {formatPrice(item.lineTotalKurus, selectedOrder.currency)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping address */}
                    <div className="mb-6 border-t border-neutral-100 pt-5">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                        Teslimat Adresi
                      </h3>
                      <p className="text-sm font-medium text-neutral-700">
                        {selectedOrder.shippingName}
                      </p>
                      <p className="text-sm text-neutral-500">{selectedOrder.shippingPhone}</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {selectedOrder.shippingAddress}, {selectedOrder.shippingDistrict},{" "}
                        {selectedOrder.shippingCity}
                      </p>
                    </div>

                    {/* Price breakdown */}
                    <div className="border-t border-neutral-100 pt-5">
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Ara Toplam</span>
                          <span>
                            {formatPrice(selectedOrder.subtotalKurus, selectedOrder.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Kargo</span>
                          <span className="font-medium text-green-600">Ücretsiz</span>
                        </div>
                        {selectedOrder.discountKurus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">
                              İndirim{selectedOrder.discountCode ? ` (${selectedOrder.discountCode})` : ""}
                            </span>
                            <span className="font-medium text-emerald-600">
                              -{formatPrice(selectedOrder.discountKurus, selectedOrder.currency)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                          <span>Toplam</span>
                          <span>
                            {formatPrice(selectedOrder.totalKurus, selectedOrder.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── ORDER LIST ── */
                  <>
                    <h2 className="mb-6 text-lg font-semibold">Siparişlerim</h2>

                    {ordersLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex flex-col items-center gap-5 py-16 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
                          <svg
                            className="h-9 w-9 text-neutral-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">Henüz siparişiniz yok</p>
                          <p className="mt-1 text-sm text-neutral-400">
                            İlk siparişinizi verin, burada görüntülensin.
                          </p>
                        </div>
                        <Link
                          href="/"
                          className="mt-2 bg-neutral-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                          Alışverişe Başla
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-neutral-100">
                        {orders.map((order) => {
                          const firstItem = order.items[0];
                          const extraCount = order.items.length - 1;
                          return (
                            <div
                              key={order.id}
                              className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"
                            >
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-neutral-100">
                                {firstItem?.productImageUrl ? (
                                  <ProductImage
                                    src={`${apiUrl}/images/products/${firstItem.productImageUrl}`}
                                    alt={firstItem.productImageAlt ?? firstItem.productName}
                                  />
                                ) : (
                                  <div className="h-full w-full bg-neutral-100" />
                                )}
                              </div>

                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <p className="truncate text-sm font-semibold">
                                  {firstItem?.productName}
                                </p>
                                {extraCount > 0 && (
                                  <p className="text-xs text-neutral-400">
                                    ve {extraCount} ürün daha
                                  </p>
                                )}
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs text-neutral-400">
                                    {order.orderNumber}
                                  </span>
                                  <span className="text-xs text-neutral-300">·</span>
                                  <span className="text-xs text-neutral-400">
                                    {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col items-end gap-2">
                                <span
                                  className={`px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(order.status)}`}
                                >
                                  {STATUS_LABELS[order.status]}
                                </span>
                                <p className="text-sm font-semibold">
                                  {formatPrice(order.totalKurus, order.currency)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-xs font-medium text-neutral-500 transition hover:text-neutral-950"
                                >
                                  Detaylar →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {/* FAVORITES TAB */}
            {tab === "favorites" && (
              <div className="border border-neutral-200 bg-white p-6 sm:p-8">
                <h2 className="mb-6 text-lg font-semibold">Favorilerim</h2>

                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center gap-5 py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
                      <svg
                        className="h-9 w-9 text-neutral-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Henüz favori ürününüz yok</p>
                      <p className="mt-1 text-sm text-neutral-400">
                        Ürünlerin üzerindeki kalp ikonuna tıklayarak favorilerinize ekleyin.
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="mt-2 bg-neutral-950 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      Alışverişe Başla
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {favorites.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-4 border border-neutral-200 p-3"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-neutral-100">
                          <ProductImage src={item.imageUrl} alt={item.imageAlt} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
                          <Link
                            href={`/products/${item.slug}`}
                            className="truncate text-sm font-semibold hover:text-neutral-600"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm font-medium text-neutral-500">
                            {formatPrice(item.priceKurus, item.currency)}
                          </p>
                        </div>
                        <div className="shrink-0 self-center">
                          <FavoriteButton item={item} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
