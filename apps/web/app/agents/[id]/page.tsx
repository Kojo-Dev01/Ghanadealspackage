import { notFound } from "next/navigation";
import { fetchAgentById, fetchAgentListings } from "../../../lib/api";
import { ExtractedShell } from "../../../components/extracted-shell";
import { PropertyCard } from "../../../components/property-card";

type AgentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: AgentPageProps) {
  const { id } = await params;
  const [agent, listings] = await Promise.all([
    fetchAgentById(id),
    fetchAgentListings(id)
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
            background: "var(--card-bg, #fff)", borderRadius: 12,
            padding: 24, border: "1px solid var(--border, #e2e8f0)", marginBottom: 32
          }}>
            <div className="agent-avatar-lg" style={{
              background: agent.color, width: 80, height: 80,
              fontSize: 28, flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                {agent.name}
                {agent.verified && (
                  <span style={{ marginLeft: 8, fontSize: 13, color: "#10B981", fontWeight: 500 }}>✓ Verified</span>
                )}
              </h1>
              <div style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 4 }}>{agent.company}</div>
              <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 14 }}>
                <span>★ {agent.rating.toFixed(1)} Rating</span>
                <span>{agent.listings} Listings</span>
                <span>{agent.years} Years Experience</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {agent.areas.map((area) => (
                  <span key={area} className="area-tag">{area}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <a className="btn btn-outline btn-sm" href={`tel:${agent.phone}`}>Call Agent</a>
                <a className="btn btn-whatsapp btn-sm" href={`https://wa.me/${agent.phone.replace("+", "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
              </div>
            </div>
          </div>

          {/* Agent Listings */}
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
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
        </div>
      </main>
    </ExtractedShell>
  );
}
