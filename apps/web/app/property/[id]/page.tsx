import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPropertyById } from "../../../lib/api";
import { ExtractedShell } from "../../../components/extracted-shell";
import { InquiryForm } from "../../../components/inquiry-form";
import { SaveButton } from "../../../components/save-button";
import { GalleryLightbox } from "../../../components/gallery-lightbox";

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
