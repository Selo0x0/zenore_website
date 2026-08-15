"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiUrl } from "../../products/product-data";
import { AdminToast } from "../admin-toast";

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
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
          <h1 className="font-serif text-2xl text-ink">İletişim</h1>
          <p className="mt-1 text-sm text-brown-muted">İletişim bilgilerini ve mesajları yönet</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-rust px-6 py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="rounded border border-brown-muted/15 bg-cream-soft p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-brown-muted">İletişim Bilgileri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["email", "phone", "address", "hours", "instagram", "whatsapp"] as (keyof ContactContent)[]).map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium capitalize text-brown-muted">
                {field === "email" ? "E-posta" : field === "phone" ? "Telefon" : field === "address" ? "Adres" : field === "hours" ? "Çalışma Saatleri" : field === "instagram" ? "Instagram Kullanıcı Adı" : "WhatsApp"}
              </label>
              <input
                type="text"
                value={form[field]}
                onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                className="border border-brown-muted/15 bg-cream-soft px-3 py-2 text-sm text-ink outline-none focus:border-rust"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg text-ink">Mesajlar</h2>
          {unread > 0 && (
            <span className="rounded-full bg-rust px-2.5 py-0.5 text-xs font-semibold text-cream">
              {unread} yeni
            </span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center border border-dashed border-brown-muted/15 bg-cream-soft text-sm text-brown-muted">
            Henüz mesaj yok
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-brown-muted/10 border border-brown-muted/15 bg-cream-soft">
            {submissions.map((sub) => (
              <div key={sub.id}>
                <button
                  type="button"
                  onClick={() => handleExpand(sub.id)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-cream"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sub.isRead ? "bg-transparent border border-brown-muted/25" : "bg-rust"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-sm ${sub.isRead ? "font-normal text-brown" : "font-semibold text-ink"}`}>
                        {sub.name}
                      </span>
                      <span className="shrink-0 text-xs text-brown-muted">
                        {new Date(sub.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-brown-muted">{sub.email}</p>
                    {sub.subject && (
                      <p className="mt-0.5 text-xs text-brown-muted">{sub.subject}</p>
                    )}
                  </div>
                </button>
                {expanded === sub.id && (
                  <div className="border-t border-brown-muted/10 bg-cream px-5 py-4">
                    <p className="text-sm leading-7 whitespace-pre-wrap text-brown">{sub.message}</p>
                    <a
                      href={`mailto:${sub.email}?subject=Re: ${sub.subject ?? ""}`}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-brown-muted underline underline-offset-2 hover:text-ink"
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
