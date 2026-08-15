type Props = { message: string; type?: "success" | "error" };

// Matches the storefront's Toast component (app/toast.tsx): light
// cream-soft card with an icon circle, rather than a dark chip.
export function AdminToast({ message, type = "success" }: Props) {
  const isError = type === "error";
  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 border border-brown-muted/15 bg-cream-soft px-5 py-4 shadow-2xl">
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isError ? "bg-red-100" : "bg-emerald-100"}`}>
        {isError ? (
          <svg className="h-3 w-3 text-red-600" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm-.5 2.5a.5.5 0 0 1 1 0v3a.5.5 0 0 1-1 0v-3zm.5 5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
        ) : (
          <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.5l2.2 2.2L9.5 3.5" />
          </svg>
        )}
      </div>
      <p className="flex-1 text-sm font-medium text-ink">{message}</p>
    </div>
  );
}
