"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { PROVINCES } from "@/lib/turkey-locations";
import { Toast } from "@/app/toast";

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return /^\+?[0-9 ()\-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15;
}

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

type Tab = "account" | "addresses" | "orders";

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

  const [tab, setTab] = useState<Tab>("account");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
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
        const [c, a] = await Promise.all([
          apiFetch<Customer>("/customers/me", token),
          apiFetch<Address[]>("/customers/me/addresses", token),
        ]);
        setCustomer(c);
        setAddresses(a);
        setAccountForm({ displayName: c.displayName ?? "", phone: c.phone ?? "" });
      } catch {
        // ignore
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
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
    } catch {
      // ignore
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

  if (!user || !customer) return null;

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
                          setAccountForm((p) => ({ ...p, phone: e.target.value }))
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
                              setAddressForm((p) => ({ ...p, phone: e.target.value }))
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
                <h2 className="mb-6 text-lg font-semibold">Siparişlerim</h2>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
