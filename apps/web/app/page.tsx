import Link from "next/link";
import { fetchProperties, fetchHomepageStats } from "../lib/api";
import { HeroSection } from "../components/hero-section";
import { PropertyCard } from "../components/property-card";
import { SectionHeader } from "../components/section-header";
import { ExtractedShell } from "../components/extracted-shell";
import { BrowseByLocation } from "../components/browse-by-location";
import { PropertyTypes } from "../components/property-types";
import { NewDevelopments } from "../components/new-developments";
import { WhyGhanaDeals } from "../components/why-ghanadeals";
import { CTABanner } from "../components/cta-banner";

export default async function HomePage() {
  const [featured, stats, newDevs] = await Promise.all([
    fetchProperties({ featured: true, limit: 8 }),
    fetchHomepageStats(),
    fetchProperties({ listingType: "new", limit: 4 }),
  ]);

  return (
    <ExtractedShell>
      <main>
        <HeroSection totalProperties={stats.totalProperties} totalAgents={stats.totalAgents} totalRegions={stats.regions.length} />

        <section className="section">
          <div className="container">
            <SectionHeader
              title="Featured Properties"
              subtitle="Handpicked properties just for you"
              action={<Link href="/listings" className="view-all">View All <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>}
            />
            <div className="property-grid">
              {featured.items.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>

        <BrowseByLocation regions={stats.regions} />

        <PropertyTypes types={stats.types} />

        <NewDevelopments items={newDevs.items} />

        <WhyGhanaDeals />

        <CTABanner />
      </main>
    </ExtractedShell>
  );
}
