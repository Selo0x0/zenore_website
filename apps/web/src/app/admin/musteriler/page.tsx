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
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-neutral-800 font-semibold tracking-tight">Müşteriler</h1>
          <p className="mt-1 text-sm text-neutral-500">{total} müşteri</p>
        </div>
        <div className="relative w-64">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950 focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
          </div>
        ) : customers.length === 0 ? (
          <p className="py-24 text-center text-sm text-neutral-400">Müşteri bulunamadı.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Müşteri</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 hidden sm:table-cell">Telefon</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Sipariş</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 hidden md:table-cell">Katılım</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Rol</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => router.push(`/admin/musteriler/${customer.id}`)}
                  className="cursor-pointer border-b border-neutral-100 transition-colors last:border-b-0 hover:bg-neutral-50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
                        {initialOf(customer)}
                      </span>
                      <div>
                        <p className="font-medium text-neutral-950">{customer.displayName ?? "—"}</p>
                        <p className="text-xs text-neutral-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700 hidden sm:table-cell">{customer.phone ?? "—"}</td>
                  <td className="px-5 py-3.5 text-neutral-700">{customer._count.orders}</td>
                  <td className="px-5 py-3.5 text-neutral-700 hidden md:table-cell">
                    {new Date(customer.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    {customer.isAdmin ? (
                      <span className="inline-flex rounded-full bg-neutral-950 px-2.5 py-0.5 text-xs font-medium text-white">Admin</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">Müşteri</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-neutral-300">
                    <svg className="ml-auto h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
