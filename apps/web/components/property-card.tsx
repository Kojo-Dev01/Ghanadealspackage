import Image from "next/image";
import Link from "next/link";
import type { PropertyRecord } from "../lib/api";
import { SaveButton } from "./save-button";

type PropertyCardProps = {
  property: PropertyRecord;
};

export function PropertyCard({ property }: PropertyCardProps) {
  const badge = property.badges.includes("premium")
    ? { label: "Premium", className: "badge badge-premium" }
    : property.badges.includes("verified")
      ? { label: "Verified", className: "badge badge-verified" }
      : null;

  return (
    <article className="property-card-v">
      <Link href={`/property/${property.id}`}>
        <div className="card-img">
          <Image src={property.image} alt={property.title} width={640} height={420} />
          <div className="card-badges">
            {badge ? <span className={badge.className}>{badge.label}</span> : null}
          </div>
          <div className="card-photo-count">{property.photos} photos</div>
          <SaveButton propertyId={property.id} />
        </div>
        <div className="card-body">
          <div className="card-type">
            {property.type} for {property.listingType === "rent" ? "Rent" : "Sale"}
          </div>
          <div className="card-price">
            {property.priceFormatted}
            {property.priceLabel ? <span className="price-period">{property.priceLabel}</span> : null}
          </div>
          <div className="card-title">{property.title}</div>
          <div className="card-location">{property.location}</div>
          <div className="card-specs">
            {property.beds > 0 ? <div className="spec">{property.beds} Beds</div> : null}
            {property.baths > 0 ? <div className="spec">{property.baths} Baths</div> : null}
            <div className="spec">{property.area} sqm</div>
          </div>
        </div>
      </Link>
    </article>
  );
}
