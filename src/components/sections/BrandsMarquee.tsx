const BRANDS = [
  "Heinz", "Kellogg's", "Cadbury", "Twinings", "McVitie's",
  "PG Tips", "Hovis", "Warburtons", "Lurpak", "Cathedral City",
  "Walkers", "Müller", "Birds Eye", "Yorkshire Tea",
];

export function BrandsMarquee() {
  return (
    <section className="py-8 lg:py-10 border-y border-(--color-border)/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Label */}
          <p className="hidden lg:block shrink-0 text-xs uppercase tracking-[0.15em] text-(--color-text-muted) font-medium whitespace-nowrap">
            Trusted brands
          </p>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-(--color-border)" />

          {/* Marquee */}
          <div
            className="flex-1 overflow-hidden"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            }}
          >
            <div className="flex items-center gap-10 lg:gap-14 animate-marquee whitespace-nowrap">
              {[...BRANDS, ...BRANDS].map((brand, i) => (
                <span
                  key={`${brand}-${i}`}
                  className="text-base lg:text-lg font-semibold text-(--color-text-muted)/40 select-none tracking-tight"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
