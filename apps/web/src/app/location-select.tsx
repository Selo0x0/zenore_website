"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
};

// Native <select> popups render inconsistently across browsers/devices
// (some shrink the option list to an unreadably small size), so this is a
// fully custom dropdown we control end to end — with a search box, since
// the province list alone has 81 entries.
export function LocationSelect({ value, onChange, options, placeholder, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = q
    ? options.filter((o) => o.toLocaleLowerCase("tr-TR").includes(q))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setQuery("");
          setOpen((prev) => !prev);
        }}
        className="flex h-11 w-full items-center justify-between border border-brown-muted/20 bg-cream px-3 text-left text-sm text-ink outline-none transition focus:border-rust disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "" : "text-brown-muted"}>{value || placeholder}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-brown-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto border border-brown-muted/15 bg-cream-soft shadow-lg">
          <div className="sticky top-0 border-b border-brown-muted/15 bg-cream-soft p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Ara..."
              className="w-full border border-brown-muted/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-rust"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-brown-muted">Sonuç bulunamadı.</p>
          ) : (
            <ul>
              {filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                      opt === value ? "bg-rust text-cream" : "text-ink hover:bg-cream"
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
