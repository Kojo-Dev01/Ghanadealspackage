import Link from "next/link";
import type { PropertyRecord } from "../lib/api";

type Props = {
  items?: PropertyRecord[];
};

export function NewDevelopments({ items = [] }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="section" style={{ background: "var(--bg-secondary)", transition: "background var(--transition-theme)" }}>
      <div className="container">
        <div className="section-header section-header-row">
          <div>
            <h2 className="section-title">New Developments</h2>
            <p className="section-subtitle">Premium projects from top developers</p>
          </div>
          <Link href="/listings?listingType=new" className="view-all">
            View All Projects 
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="dev-grid" id="devGrid">
          {items.map((property) => (
            <a key={property.id} href={`/property/${property.id}`} className="dev-card">
              <div className="dev-img"><img src={property.image || "/legacy/assets/properties/property-villa-1.jpg"} alt={property.title} loading="lazy" /></div>
              <div className="dev-body">
                <span className="dev-label">NEW</span>
                <div className="dev-name">{property.title}</div>
                <div className="dev-location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {property.location || property.region}
                </div>
                <div className="dev-price">{property.priceFormatted}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
