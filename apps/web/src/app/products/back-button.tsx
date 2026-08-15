"use client";

import { useRouter } from "next/navigation";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm font-medium text-brown-muted transition hover:text-ink"
    >
      ← {label}
    </button>
  );
}
