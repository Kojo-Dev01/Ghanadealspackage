import { Suspense } from "react";
import { fetchProperties } from "../../lib/api";
import { ExtractedShell } from "../../components/extracted-shell";
import { ListingsContent } from "../../components/listings-content";

type ListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const sp = await searchParams;
  const listingType = firstParam(sp.listingType) ?? "";
  const q = firstParam(sp.q) ?? "";
  const type = firstParam(sp.type) ?? "";
  const region = firstParam(sp.region) ?? "";
  const minPrice = firstParam(sp.minPrice) ?? "";
  const maxPrice = firstParam(sp.maxPrice) ?? "";
  const minBeds = firstParam(sp.minBeds) ?? "";
  const minBaths = firstParam(sp.minBaths) ?? "";
  const page = Math.max(1, Number(firstParam(sp.page) ?? "1") || 1);
  const limit = 50;

  const result = await fetchProperties({
    listingType: listingType || undefined,
    q: q || undefined,
    type: type || undefined,
    region: region || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    minBeds: minBeds || undefined,
    minBaths: minBaths || undefined,
    page,
    limit,
  });

  const initialFilters = { q, listingType, type, minPrice, maxPrice, minBeds, minBaths };

  return (
    <ExtractedShell>
      <main>
        <section className="section" style={{ paddingTop: 32 }}>
          <div className="container">
            <Suspense>
              <ListingsContent
                initialItems={result.items}
                initialTotal={result.total}
                initialPage={page}
                initialFilters={initialFilters}
                limit={limit}
              />
            </Suspense>
          </div>
        </section>
      </main>
    </ExtractedShell>
  );
}
