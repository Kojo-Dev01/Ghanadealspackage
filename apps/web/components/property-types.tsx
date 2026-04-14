import { Building2, Home, Castle, Warehouse, Store, Mountain, Landmark, HardHat, Hotel, Layers, LayoutGrid, Columns2, Building, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

const TYPE_DATA: Record<string, { icon: ReactNode; image: string }> = {
  Apartment: { icon: <Building2 size={20} />, image: "/legacy/assets/properties/property-apartment-1.jpg" },
  House: { icon: <Home size={20} />, image: "/legacy/assets/properties/property-villa-1.jpg" },
  Villa: { icon: <Castle size={20} />, image: "/legacy/assets/properties/property-villa-2.jpg" },
  Townhouse: { icon: <Warehouse size={20} />, image: "/legacy/assets/properties/property-townhouse-1.jpg" },
  Penthouse: { icon: <ArrowUpDown size={20} />, image: "/legacy/assets/properties/property-apartment-1.jpg" },
  Compound: { icon: <LayoutGrid size={20} />, image: "/legacy/assets/properties/property-villa-1.jpg" },
  Duplex: { icon: <Columns2 size={20} />, image: "/legacy/assets/properties/property-townhouse-1.jpg" },
  Bungalow: { icon: <Home size={20} />, image: "/legacy/assets/properties/property-villa-2.jpg" },
  "Full Floor": { icon: <Layers size={20} />, image: "/legacy/assets/properties/large_property-commercial-1.jpg" },
  "Half Floor": { icon: <Layers size={20} />, image: "/legacy/assets/properties/large_property-commercial-1.jpg" },
  "Whole Building": { icon: <Building size={20} />, image: "/legacy/assets/properties/large_property-commercial-1.jpg" },
  Land: { icon: <Mountain size={20} />, image: "/legacy/assets/properties/property-land-1.jpg" },
  Commercial: { icon: <Store size={20} />, image: "/legacy/assets/properties/large_property-commercial-1.jpg" },
  Office: { icon: <Landmark size={20} />, image: "/legacy/assets/properties/large_property-interior-1.jpg" },
  "Bulk Sale Unit": { icon: <Warehouse size={20} />, image: "/legacy/assets/properties/large_property-commercial-1.jpg" },
  "Hotel & Hotel Apartment": { icon: <Hotel size={20} />, image: "/legacy/assets/properties/large_property-interior-1.jpg" },
};

const FALLBACK = { icon: <HardHat size={20} />, image: "/legacy/assets/properties/property-villa-1.jpg" };

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
          {types.map((type) => {
            const data = TYPE_DATA[type.name] ?? FALLBACK;
            return (
              <a key={type.name} href={`/listings?type=${encodeURIComponent(type.name)}`} className="ptype-card">
                <div className="ptype-img">
                  <img src={data.image} alt={type.name} loading="lazy" />
                </div>
                <div className="ptype-body">
                  <div className="ptype-icon">{data.icon}</div>
                  <div className="ptype-name">{type.name}</div>
                  <div className="ptype-count">{type.count.toLocaleString()} {type.count === 1 ? "property" : "properties"}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
