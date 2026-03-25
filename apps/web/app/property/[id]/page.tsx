import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPropertyById } from "../../../lib/api";
import { ExtractedShell } from "../../../components/extracted-shell";
import { InquiryForm } from "../../../components/inquiry-form";
import { SaveButton } from "../../../components/save-button";

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
  const mainImage = gallery[0];
  const extraCount = gallery.length > 3 ? gallery.length - 3 : 0;

  return (
    <ExtractedShell>
      <main className="detail-page">
        <div className="container">
          <div className="gallery-grid" style={{ marginTop: 20 }}>
            <div className="gallery-main">
              <Image src={mainImage} alt={property.title} width={1200} height={700} />
              <div className="card-photo-count" style={{ position: "absolute", bottom: 12, left: 12 }}>{gallery.length} Photos</div>
            </div>
            <div className="gallery-side">
              <div className="gallery-side-img">
                <Image src={gallery[1] ?? mainImage} alt="Interior" width={500} height={320} />
              </div>
              <div className="gallery-side-img" style={{ position: "relative" }}>
                <Image src={gallery[2] ?? mainImage} alt="View" width={500} height={320} />
                {extraCount > 0 && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, borderRadius: "inherit" }}>
                    +{extraCount} more
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full gallery strip (shown when more than 3 photos) */}
          {gallery.length > 3 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginTop: 12 }}>
              {gallery.map((src, i) => (
                <div key={i} style={{ flexShrink: 0, width: 140, height: 95, borderRadius: 8, overflow: "hidden", border: "2px solid var(--border, #eee)" }}>
                  <Image src={src} alt={`Photo ${i + 1}`} width={140} height={95} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

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
            </div>

            <div className="detail-sidebar">
              <div className="detail-sidebar-inner">
                <div className="agent-card-detail">
                  <div className="agent-card-header">
                    <div className="agent-avatar-lg" style={{ background: property.agent.color }}>
                      {property.agent.name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div className="agent-details">
                      <div className="agent-name-lg">{property.agent.name}</div>
                      <div className="agent-company-lg">{property.agent.company}</div>
                    </div>
                  </div>
                  <div className="agent-btn-group">
                    <a className="btn btn-outline" href={`tel:${property.agent.phone}`}>Call Agent</a>
                    <a className="btn btn-whatsapp" href={`https://wa.me/${property.agent.phone.replace("+", "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
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
