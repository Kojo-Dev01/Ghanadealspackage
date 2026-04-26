import Image from "next/image";
import Link from "next/link";
import type { PropertyRecord } from "../lib/api";
import { SaveButton } from "./save-button";

// 10×7 neutral gray — shown while the real image loads (remote images require an explicit blurDataURL)
const CARD_BLUR_PLACEHOLDER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAHCAYAAAAxrNxjAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAJElEQVQI12NgYGD4z8BQDwAEgAF/QualIgAAAABJRU5ErkJggg==";

type PropertyCardProps = {
  property: PropertyRecord;
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function PropertyCard({ property, isHighlighted, onMouseEnter, onMouseLeave }: PropertyCardProps) {
  const badge = property.badges.includes("premium")
    ? { label: "Premium", className: "badge badge-premium" }
    : property.badges.includes("verified")
      ? { label: "Verified", className: "badge badge-verified" }
      : null;

  return (
    <article
      className={`property-card-v${isHighlighted ? " property-card-v--highlighted" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="card-img gd-shimmer-bg">
        <Link href={`/property/${property.id}`}>
          <Image
            src={property.image}
            alt={property.title}
            width={640}
            height={420}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={75}
            placeholder="blur"
            blurDataURL={CARD_BLUR_PLACEHOLDER}
          />
        </Link>
        <div className="card-badges">
          {badge ? <span className={badge.className}>{badge.label}</span> : null}
        </div>
        <div className="card-photo-count">{property.photos} photos</div>
        <SaveButton propertyId={property.id} />
      </div>
      <Link href={`/property/${property.id}`}>
        <div className="card-body">
          <div className="card-type">
            {property.type} {({ sale: "for Sale", rent: "for Rent", new: "— New Development", land: "— Land", uncompleted: "— Uncompleted" } as Record<string, string>)[property.listingType] ?? `for ${property.listingType}`}
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
