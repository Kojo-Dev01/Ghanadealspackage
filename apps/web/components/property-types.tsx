const TYPE_ICONS: Record<string, string> = {
  "Apartment": "🏢",
  "House": "🏠",
  "Villa": "🏡",
  "Townhouse": "🏘️",
  "Commercial": "🏪",
  "Land": "🌍",
  "Office": "🏛️",
};

type Props = {
  types?: { name: string; count: number }[];
};

export function PropertyTypes({ types = [] }: Props) {
  if (types.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Property Types</h2>
          <p className="section-subtitle">Find exactly what you&apos;re looking for</p>
        </div>
        <div className="ptypes-grid" id="ptypesGrid">
          {types.map((type) => (
            <a key={type.name} href={`/listings?type=${encodeURIComponent(type.name)}`} className="ptype-card">
              <div className="ptype-icon">{TYPE_ICONS[type.name] ?? "🏗️"}</div>
              <div className="ptype-name">{type.name}</div>
              <div className="ptype-count">{type.count.toLocaleString()} {type.count === 1 ? "property" : "properties"}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
