const badges = [
  {
    label: "Hakiki Deri Garantisi",
    description: "%100 orijinal, birinci sınıf deri.",
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
  },
  {
    label: "Ücretsiz Kargo",
    description: "Tüm siparişlerde ücretsiz kargo.",
    icon: (
      <>
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
  },
  {
    label: "Güvenli Ödeme",
    description: "256-bit SSL ile güvenli alışveriş.",
    icon: (
      <>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    label: "30 Gün İade Hakkı",
    description: "Memnun kalmazsanız iade edin.",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
  },
];

export function TrustBadges() {
  return (
    <section className="bg-cream">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-5 py-8 sm:px-8 md:grid-cols-4 md:gap-0 md:divide-x md:divide-brown-muted/15 lg:px-10">
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3 md:px-6 md:first:pl-0 md:last:pr-0">
            <svg
              className="h-6 w-6 shrink-0 text-rust-dark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {badge.icon}
            </svg>
            <div>
              <p className="font-serif text-sm text-ink">{badge.label}</p>
              <p className="text-xs text-brown-muted">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
