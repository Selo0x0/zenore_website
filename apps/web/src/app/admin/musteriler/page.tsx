"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";

type Customer = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: { orders: number };
};

function initialOf(customer: Customer) {
  const source = customer.displayName ?? customer.email;
  return source[0]?.toUpperCase() ?? "?";
}

export default function AdminMusterilerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchCustomers(q: string) {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const query = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : "";
      const res = await apiFetch<{ customers: Customer[]; total: number }>(`/admin/customers${query}`, token);
      setCustomers(res.customers);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void fetchCustomers(search), 300);
    return () => clearTimeout(t);
  }, [user, search]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink tracking-tight">Müşteriler</h1>
          <p className="mt-1 text-sm text-brown-muted">{total} müşteri</p>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-brown-muted/15 bg-cream py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-rust focus:bg-cream-soft"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-brown-muted/15 bg-cream-soft py-24">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
        </div>
      ) : customers.length === 0 ? (
        <p className="rounded-xl border border-brown-muted/15 bg-cream-soft py-24 text-center text-sm text-brown-muted">
          Müşteri bulunamadı.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col divide-y divide-brown-muted/10 rounded-xl border border-brown-muted/15 bg-cream-soft sm:hidden">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => router.push(`/admin/musteriler/${customer.id}`)}
                className="flex items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-cream"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rust text-xs font-semibold text-cream">
                  {initialOf(customer)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{customer.displayName ?? "—"}</p>
                  <p className="truncate text-xs text-brown-muted">{customer.email}</p>
                  <p className="mt-0.5 text-xs text-brown-muted">
                    {customer.phone ?? "—"} · {customer._count.orders} sipariş
                  </p>
                </div>
                {customer.isAdmin ? (
                  <span className="inline-flex shrink-0 rounded-full bg-rust px-2.5 py-0.5 text-xs font-medium text-cream">Admin</span>
                ) : (
                  <span className="inline-flex shrink-0 rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-brown">Müşteri</span>
                )}
              </button>
            ))}
          </div>

          {/* sm and up: table */}
          <div className="hidden overflow-x-auto no-scrollbar rounded-xl border border-brown-muted/15 bg-cream-soft sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brown-muted/10 bg-cream">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Müşteri</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted hidden md:table-cell">Telefon</th>
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Sipariş</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted hidden md:table-cell">Katılım</th>
                  <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-brown-muted">Rol</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/admin/musteriler/${customer.id}`)}
                    className="cursor-pointer border-b border-brown-muted/10 transition-colors last:border-b-0 hover:bg-cream"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust text-xs font-semibold text-cream">
                          {initialOf(customer)}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{customer.displayName ?? "—"}</p>
                          <p className="text-xs text-brown-muted">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-brown hidden md:table-cell">{customer.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-brown">{customer._count.orders}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-brown hidden md:table-cell">
                      {new Date(customer.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {customer.isAdmin ? (
                        <span className="inline-flex rounded-full bg-rust px-2.5 py-0.5 text-xs font-medium text-cream">Admin</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-brown">Müşteri</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-brown-muted">
                      <svg className="ml-auto h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
