"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiUrl } from "@/app/products/product-data";

function resolveImageUrl(value: string) {
  return value.startsWith("http") ? value : `${apiUrl}/images/products/${value}`;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ImageUploadField({ value, onChange, className }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiUrl}/admin/images/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Yükleme başarısız.");
      onChange(data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-3 transition ${
          dragOver ? "border-rust bg-cream" : "border-brown-muted/15 hover:border-brown-muted/40"
        }`}
      >
        {uploading ? (
          <div className="flex w-full items-center justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brown-muted/15 border-t-rust" />
          </div>
        ) : value ? (
          <>
            <img
              src={resolveImageUrl(value)}
              alt=""
              className="h-14 w-14 shrink-0 rounded object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-brown-muted">{value}</p>
              <p className="text-xs font-medium text-ink">Değiştirmek için tıklayın veya sürükleyin</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="shrink-0 px-2 text-xs font-medium text-brown-muted hover:text-red-500"
            >
              Kaldır
            </button>
          </>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-1.5 py-3 text-center">
            <svg className="h-5 w-5 text-brown-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-xs font-medium text-brown">Görsel yüklemek için tıklayın veya sürükleyin</p>
            <p className="text-[11px] text-brown-muted">PNG, JPG, WEBP · maks. 8MB</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
