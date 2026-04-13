import { notFound } from "next/navigation";
import { fetchAgentById, fetchAgentListings, fetchAgentReviews } from "../../../lib/api";
import { ExtractedShell } from "../../../components/extracted-shell";
import { PropertyCard } from "../../../components/property-card";
import { AgentReviews } from "../../../components/agent-reviews";
import { MessageSellerButton } from "../../../components/message-seller-button";

type AgentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const { id } = await params;
  const [agent, listings, reviewData] = await Promise.all([
    fetchAgentById(id),
    fetchAgentListings(id),
    fetchAgentReviews(id),
  ]);

  if (!agent) {
    notFound();
  }

  const initials = agent.name.split(" ").map((p) => p[0]).join("");

  return (
    <ExtractedShell>
      <main style={{ padding: "30px 0 60px" }}>
        <div className="container">
          {/* Agent Profile Header */}
          <div style={{
            display: "flex", gap: 24, alignItems: "flex-start",
            background: "var(--bg-card)", borderRadius: "var(--radius-lg)",
            padding: 24, border: "1px solid var(--border-primary)", marginBottom: 32,
            boxShadow: "var(--shadow-card)",
            flexWrap: "wrap",
          }}>
            <div className="agent-avatar-lg" style={{
              background: agent.avatar_url ? undefined : agent.color, width: 80, height: 80,
              fontSize: 28, flexShrink: 0, overflow: "hidden"
            }}>
              {agent.avatar_url
                ? <img src={agent.avatar_url} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                {agent.name}
                {agent.verified && (
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" fill="var(--red, #dc2626)" />
                    <path d="M8 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </h1>
              <div style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 4 }}>{agent.company}</div>
              <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 14, color: "var(--text-primary)", flexWrap: "wrap" }}>
                <span>★ {agent.rating.toFixed(1)} Rating {agent.reviewCount > 0 && <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>({agent.reviewCount} review{agent.reviewCount !== 1 ? "s" : ""})</span>}</span>
                <span>{agent.listings} Listings</span>
                <span>{agent.years} Years Experience</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {agent.areas.map((area) => (
                  <span key={area} className="area-tag">{area}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <a className="btn btn-outline btn-sm" href={`tel:${agent.phone}`}>Call Seller</a>
                <a className="btn btn-whatsapp btn-sm" href={`https://wa.me/${agent.phone.replace("+", "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
                {agent.userId && <MessageSellerButton sellerId={agent.userId} sellerName={agent.name} />}
              </div>
            </div>
          </div>

          {/* Agent Listings */}
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
            Listings by {agent.name} ({listings.total})
          </h2>

          {listings.items.length > 0 ? (
            <div className="property-grid">
              {listings.items.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              No approved listings at the moment.
            </p>
          )}

          {/* Agent Reviews */}
          <div style={{ marginTop: 48 }}>
            <AgentReviews agentId={id} reviews={reviewData.items} total={reviewData.total} />
          </div>
        </div>
      </main>
    </ExtractedShell>
  );
}
