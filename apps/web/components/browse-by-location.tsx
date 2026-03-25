const REGION_IMAGES: Record<string, string> = {
  "Greater Accra": "/legacy/assets/properties/property-villa-1.jpg",
  "Ashanti": "/legacy/assets/properties/property-apartment-1.jpg",
  "Western": "/legacy/assets/properties/property-villa-2.jpg",
  "Eastern": "/legacy/assets/properties/property-townhouse-1.jpg",
  "Central": "/legacy/assets/properties/property-house-2.jpg",
  "Volta": "/legacy/assets/properties/property-interior-1.jpg",
  "Northern": "/legacy/assets/properties/property-land-1.jpg",
};

const FALLBACK_IMAGE = "/legacy/assets/properties/property-commercial-1.jpg";

type Props = {
  regions?: { name: string; count: number }[];
};

export function BrowseByLocation({ regions = [] }: Props) {
  const display = regions.length > 0 ? regions.slice(0, 8) : [];

  if (display.length === 0) return null;

  return (
    <section className="section" style={{ background: "var(--bg-secondary)", transition: "background var(--transition-theme)" }}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Browse by Location</h2>
          <p className="section-subtitle">Explore properties across Ghana&apos;s regions</p>
        </div>
        <div className="locations-grid" id="locationsGrid">
          {display.map((region) => (
            <a key={region.name} href={`/listings?region=${encodeURIComponent(region.name)}`} className="location-card">
              <img className="loc-bg" src={REGION_IMAGES[region.name] ?? FALLBACK_IMAGE} alt={region.name} loading="lazy" />
              <div className="loc-overlay" />
              <div className="loc-info">
                <div className="loc-name">{region.name}</div>
                <div className="loc-count">{region.count.toLocaleString()} {region.count === 1 ? "property" : "properties"}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
