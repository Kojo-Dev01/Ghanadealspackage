import Link from "next/link";
import { fetchProperties } from "../../lib/api";
import { PropertyCard } from "../../components/property-card";
import { SectionHeader } from "../../components/section-header";
import { ExtractedShell } from "../../components/extracted-shell";
import { ListingsFilters } from "../../components/listings-filters";

type ListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const sp = await searchParams;
  const listingType = firstParam(sp.listingType);
  const q = firstParam(sp.q);
  const type = firstParam(sp.type);
  const region = firstParam(sp.region);
  const minPrice = firstParam(sp.minPrice);
  const maxPrice = firstParam(sp.maxPrice);
  const minBeds = firstParam(sp.minBeds);
  const minBaths = firstParam(sp.minBaths);

  const result = await fetchProperties({
    listingType,
    q,
    type,
    region,
    minPrice,
    maxPrice,
    minBeds,
    minBaths,
    page: 1,
    limit: 24
  });

  return (
    <ExtractedShell>
      <main>
        <section className="section" style={{ paddingTop: 48 }}>
          <div className="container">
            <SectionHeader
              title="Listings"
              subtitle={`${result.total} properties found`}
              action={<Link href="/" className="btn btn-outline">Home</Link>}
            />

            <ListingsFilters
              q={q}
              listingType={listingType}
              type={type}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minBeds={minBeds}
              minBaths={minBaths}
            />

            <div className="property-grid">
              {result.items.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </ExtractedShell>
  );
}
