import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPropertyById } from "../../../lib/api";
import { ExtractedShell } from "../../../components/extracted-shell";
import { InquiryForm } from "../../../components/inquiry-form";
import { SaveButton } from "../../../components/save-button";
import { GalleryLightbox } from "../../../components/gallery-lightbox";
import { MortgageCalculator } from "../../../components/mortgage-calculator";
import { PropertyMessageButton } from "../../../components/property-message-button";
import { PropertyDescription } from "../../../components/property-description";
import { AmenityIcon } from "../../../components/amenity-icon";
import { PropertyDetailMap } from "../../../components/property-detail-map";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const property = await fetchPropertyById(id);

  if (!property) {
    notFound();
  }

  const gallery = property.gallery?.length ? property.gallery : [property.imageLg ?? property.image];
  const floorPlans = property.floorPlans ?? [];
  const hasCoordinates = property.latitude != null && property.longitude != null;

  return (
    <ExtractedShell>
      <main className="detail-page">
        <div className="container">
          {/* Breadcrumb — above gallery */}
          <nav className="detail-breadcrumb">
            <Link href="/listings" className="detail-breadcrumb-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Properties
            </Link>
            <div className="detail-breadcrumb-trail">
              <Link href="/">Ghana</Link>
              <span className="detail-breadcrumb-sep">›</span>
              <Link href={`/listings?region=${encodeURIComponent(property.region)}`}>{property.region}</Link>
              <span className="detail-breadcrumb-sep">›</span>
              <span>{property.type} {({ sale: "for Sale", rent: "for Rent", new: "— New Development", land: "— Land", uncompleted: "— Uncompleted" } as Record<string, string>)[property.listingType] ?? `for ${property.listingType}`}</span>
            </div>
          </nav>

          <GalleryLightbox images={gallery} alt={property.title} />

          <div className="detail-layout">
            <div className="detail-main">
              <div className="detail-price-section">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div className="detail-price">{property.priceFormatted}{property.priceLabel ?? ""}</div>
                    <h1 className="detail-title">{property.title}</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 14 }}>{property.location}</div>
                  </div>
                  <SaveButton propertyId={id} variant="detail" />
                </div>
              </div>

              <div className="detail-section">
                <h3 className="detail-section-title">Description</h3>
                <PropertyDescription text={property.description} />
              </div>

              <div className="detail-section">
                <h3 className="detail-section-title">Property Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Reference</span><span className="detail-item-value">{property.ref}</span></div>
                  </div>
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Type</span><span className="detail-item-value">{property.type}</span></div>
                  </div>
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Bedrooms</span><span className="detail-item-value">{property.beds || "N/A"}</span></div>
                  </div>
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Bathrooms</span><span className="detail-item-value">{property.baths || "N/A"}</span></div>
                  </div>
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Area</span><span className="detail-item-value">{property.area} sqm</span></div>
                  </div>
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Furnishing</span><span className="detail-item-value">{property.furnishing}</span></div>
                  </div>
                  <div className="detail-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 3v6"/><path d="M15 3v6"/></svg>
                    <div className="detail-item-content"><span className="detail-item-label">Parking</span><span className="detail-item-value">{property.parking}</span></div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3 className="detail-section-title">Amenities & Features</h3>
                <div className="amenities-grid">
                  {property.amenities.map((amenity) => (
                    <div className="amenity-item" key={amenity}>
                      <AmenityIcon name={amenity} />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Floor Plans */}
              {floorPlans.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Floor Plans</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {floorPlans.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                        <img src={url} alt={`Floor plan ${i + 1}`} style={{ width: "100%", height: "auto" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Location */}
              {hasCoordinates && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Location on Map</h3>
                  <PropertyDetailMap
                    latitude={property.latitude!}
                    longitude={property.longitude!}
                    title={property.title}
                    image={gallery[0] ?? ""}
                    priceFormatted={property.priceFormatted}
                    type={property.type}
                    listingType={property.listingType}
                  />
                </div>
              )}

              {/* Mortgage Calculator */}
              {property.listingType === "sale" && (
                <div className="detail-section">
                  <MortgageCalculator price={property.price} />
                </div>
              )}
            </div>

            <div className="detail-sidebar">
              <div className="detail-sidebar-inner">
                <div className="agent-card-detail">
                  <div className="agent-card-header">
                    <div className="agent-avatar-lg" style={{ background: property.agent.avatar_url ? undefined : property.agent.color, overflow: "hidden" }}>
                      {property.agent.avatar_url
                        ? <img src={property.agent.avatar_url} alt={property.agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : property.agent.name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div className="agent-details">
                      <div className="agent-name-lg">{property.agent.name}</div>
                      <div className="agent-company-lg">{property.agent.company}</div>
                    </div>
                  </div>
                  <div className="agent-btn-group">
                    <a className="btn btn-outline" href={`tel:${property.agent.phone}`}>Call Seller</a>
                    <a className="btn btn-whatsapp" href={`https://wa.me/${property.agent.phone.replace("+", "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
                    <PropertyMessageButton propertyId={id} />
                  </div>
                </div>

                <InquiryForm propertyId={id} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </ExtractedShell>
  );
}
