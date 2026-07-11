"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiUrl } from "../../products/product-data";

type ContactContent = {
  email: string;
  phone: string;
  address: string;
  hours: string;
  instagram: string;
  whatsapp: string;
};

type Submission = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const DEFAULT: ContactContent = {
  email: "info@zenore.com",
  phone: "+90 532 123 45 67",
  address: "Kapalıçarşı, Beyazıt, İstanbul",
  hours: "Hafta içi 09:00 – 18:00",
  instagram: "zenore_leather",
  whatsapp: "+905321234567",
};

export default function AdminIletisimPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ContactContent>(DEFAULT);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`${apiUrl}/site-content/contact`).then((r) => r.json()),
      user.getIdToken().then((token) =>
        fetch(`${apiUrl}/admin/contact-submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
      ),
    ])
      .then(([content, subs]: [ContactContent, Submission[]]) => {
        setForm(content);
        setSubmissions(subs);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${apiUrl}/admin/site-content/contact`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showToast("Kaydedildi", "success");
    } catch {
      showToast("Kaydetme başarısız", "error");
    } finally {
      setSaving(false);
    }
  }

  async function markRead(id: string) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`${apiUrl}/admin/contact-submissions/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isRead: true } : s))
      );
    } catch {
      /* silent */
    }
  }

  function handleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
    const sub = submissions.find((s) => s.id === id);
    if (sub && !sub.isRead) markRead(id);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-950" />
      </div>
    );
  }

  const unread = submissions.filter((s) => !s.isRead).length;

  return (
    <div className="flex flex-col gap-8 p-8">
      {toast && <AdminToast message={toast.message} type={toast.type} />}

      {/* Contact info editor */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950">İletişim</h1>
          <p className="mt-1 text-sm text-neutral-500">İletişim bilgilerini ve mesajları yönet</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-neutral-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="rounded border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">İletişim Bilgileri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["email", "phone", "address", "hours", "instagram", "whatsapp"] as (keyof ContactContent)[]).map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium capitalize text-neutral-500">
                {field === "email" ? "E-posta" : field === "phone" ? "Telefon" : field === "address" ? "Adres" : field === "hours" ? "Çalışma Saatleri" : field === "instagram" ? "Instagram Kullanıcı Adı" : "WhatsApp"}
              </label>
              <input
                type="text"
                value={form[field]}
                onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                className="border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none focus:border-neutral-950"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Mesajlar</h2>
          {unread > 0 && (
            <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-xs font-semibold text-white">
              {unread} yeni
            </span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center border border-dashed border-neutral-200 bg-white text-sm text-neutral-400">
            Henüz mesaj yok
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100 border border-neutral-200 bg-white">
            {submissions.map((sub) => (
              <div key={sub.id}>
                <button
                  type="button"
                  onClick={() => handleExpand(sub.id)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-neutral-50"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sub.isRead ? "bg-transparent border border-neutral-300" : "bg-neutral-950"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-sm ${sub.isRead ? "font-normal text-neutral-700" : "font-semibold text-neutral-950"}`}>
                        {sub.name}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {new Date(sub.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{sub.email}</p>
                    {sub.subject && (
                      <p className="mt-0.5 text-xs text-neutral-500">{sub.subject}</p>
                    )}
                  </div>
                </button>
                {expanded === sub.id && (
                  <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4">
                    <p className="text-sm leading-7 whitespace-pre-wrap text-neutral-700">{sub.message}</p>
                    <a
                      href={`mailto:${sub.email}?subject=Re: ${sub.subject ?? ""}`}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-950"
                    >
                      {sub.email} adresine yanıtla
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminToast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  const isError = type === "error";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 shadow-2xl ring-1 ring-white/5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isError ? "bg-red-500/15" : "bg-emerald-500/15"}`}>
        {isError ? (
          <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-white">{message}</span>
    </div>
  );
}
