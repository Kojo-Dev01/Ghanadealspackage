import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPropertyById } from "../../../lib/api";
import { ExtractedShell } from "../../../components/extracted-shell";
import { InquiryForm } from "../../../components/inquiry-form";
import { SaveButton } from "../../../components/save-button";
import { GalleryLightbox } from "../../../components/gallery-lightbox";
import { MortgageCalculator } from "../../../components/mortgage-calculator";
import { PropertyMessageButton } from "../../../components/property-message-button";

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
          <GalleryLightbox images={gallery} alt={property.title} />

          <div className="breadcrumb">
            <Link href="/">Ghana</Link> <span>›</span>
            <Link href="/listings">{property.region}</Link> <span>›</span>
            <span>{property.type} for {property.listingType === "rent" ? "Rent" : "Sale"}</span>
          </div>

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
                <div className="detail-description">{property.description}</div>
              </div>

              <div className="detail-section">
                <h3 className="detail-section-title">Property Details</h3>
                <div className="details-table">
                  <div className="dt-row"><span className="dt-label">Reference</span><span className="dt-value">{property.ref}</span></div>
                  <div className="dt-row"><span className="dt-label">Type</span><span className="dt-value">{property.type}</span></div>
                  <div className="dt-row"><span className="dt-label">Bedrooms</span><span className="dt-value">{property.beds || "N/A"}</span></div>
                  <div className="dt-row"><span className="dt-label">Bathrooms</span><span className="dt-value">{property.baths || "N/A"}</span></div>
                  <div className="dt-row"><span className="dt-label">Area</span><span className="dt-value">{property.area} sqm</span></div>
                  <div className="dt-row"><span className="dt-label">Furnishing</span><span className="dt-value">{property.furnishing}</span></div>
                  <div className="dt-row"><span className="dt-label">Parking</span><span className="dt-value">{property.parking}</span></div>
                </div>
              </div>

              <div className="detail-section">
                <h3 className="detail-section-title">Amenities & Features</h3>
                <div className="amenities-grid">
                  {property.amenities.map((amenity) => (
                    <div className="amenity-item" key={amenity}>{amenity}</div>
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
                  <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <iframe
                      title="Property location"
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude! - 0.005}%2C${property.latitude! - 0.005}%2C${property.longitude! + 0.005}%2C${property.latitude! + 0.005}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
                    />
                  </div>
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
