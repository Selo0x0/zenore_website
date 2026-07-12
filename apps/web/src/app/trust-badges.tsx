const badges = [
  {
    label: "Hakiki Deri Garantisi",
    icon: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
  },
  {
    label: "Ücretsiz Kargo",
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
    icon: (
      <>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    label: "30 Gün İade Hakkı",
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
    <section className="border-b border-neutral-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4 lg:px-10">
        {badges.map((badge) => (
          <div key={badge.label} className="flex flex-col items-center gap-2 text-center">
            <svg
              className="h-6 w-6 text-neutral-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {badge.icon}
            </svg>
            <span className="text-xs font-medium text-neutral-600">{badge.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
