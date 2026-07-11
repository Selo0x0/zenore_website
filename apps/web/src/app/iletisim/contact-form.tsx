"use client";

import { useState } from "react";
import { apiUrl } from "../products/product-data";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(`${apiUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-start gap-4 border border-emerald-200 bg-emerald-50 p-8">
        <svg className="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <div>
          <p className="font-medium text-emerald-900">Mesajınız iletildi</p>
          <p className="mt-1 text-sm text-emerald-700">
            En kısa sürede size geri döneceğiz.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950 placeholder:text-neutral-300"
            placeholder="Adınız ve soyadınız"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">
            E-posta <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950 placeholder:text-neutral-300"
            placeholder="ornek@email.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="subject" className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">
          Konu
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={handleChange}
          className="border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950 placeholder:text-neutral-300"
          placeholder="Mesajınızın konusu"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">
          Mesaj <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={form.message}
          onChange={handleChange}
          className="resize-none border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-950 placeholder:text-neutral-300"
          placeholder="Mesajınızı buraya yazın..."
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">
          Mesaj gönderilemedi. Lütfen tekrar deneyin.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start bg-neutral-950 px-8 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {status === "sending" ? "Gönderiliyor..." : "Gönder"}
      </button>
    </form>
  );
}
