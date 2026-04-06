import Link from "next/link";
import type { AgentRecord } from "../lib/api";

type AgentCardProps = {
  agent: AgentRecord;
};

export function AgentCard({ agent }: AgentCardProps) {
  const initials = agent.name.split(" ").map((part) => part[0]).join("");

  return (
    <article className="agent-card-grid">
      <Link href={`/agents/${agent.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="agent-avatar-grid" style={{ background: agent.avatar_url ? undefined : agent.color, overflow: "hidden" }}>
          {agent.avatar_url
            ? <img src={agent.avatar_url} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        <div className="agent-name-grid">{agent.name}</div>
        <div className="agent-company-grid">{agent.company}</div>
      </Link>
      <div className="agent-rating">★ {agent.rating.toFixed(1)}</div>
      <div className="agent-areas">
        {agent.areas.map((area) => (
          <span key={area} className="area-tag">{area}</span>
        ))}
      </div>
      <div className="agent-stats">
        <div className="stat-item"><div className="stat-val">{agent.listings}</div><div className="stat-label">Listings</div></div>
        <div className="stat-item"><div className="stat-val">{agent.years}</div><div className="stat-label">Years Exp.</div></div>
        <div className="stat-item"><div className="stat-val">{agent.rating.toFixed(1)}</div><div className="stat-label">Rating</div></div>
      </div>
      <div className="agent-btns">
        <a className="btn btn-outline btn-sm" href={`tel:${agent.phone}`}>Call</a>
        <a className="btn btn-whatsapp btn-sm" href={`https://wa.me/${agent.phone.replace("+", "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
    </article>
  );
}
