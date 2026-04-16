"use client";

import { useRouter } from "next/navigation";
import { Building2, Phone, MapPin, Clock } from "lucide-react";
import type { AdminAgent } from "@/lib/api";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

function resolveImg(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${WEB_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

const STATUS_STYLES: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  unverified: { label: "Unverified", bg: "rgba(148,163,184,0.12)", color: "var(--color-muted, #64748b)" },
  pending: { label: "Pending Review", bg: "rgba(245,158,11,0.12)", color: "var(--status-warning-text, #d97706)" },
  approved: { label: "Verified", bg: "rgba(16,185,129,0.12)", color: "var(--status-success-text, #16a34a)" },
  rejected: { label: "Rejected", bg: "rgba(239,68,68,0.1)", color: "var(--status-danger-text, #dc2626)" },
};

export function SellerCard({ agent }: { agent: AdminAgent }) {
  const router = useRouter();
  const imgSrc = resolveImg(agent.avatarUrl);
  const status = STATUS_STYLES[agent.verificationStatus] ?? STATUS_STYLES.unverified;

  return (
    <article
      className="bg-panel border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
      onClick={() => router.push(`/agents/${agent.id}`)}
    >
      {/* Avatar image */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          aspectRatio: "16/10",
          backgroundColor: "var(--color-panel-alt, #f8fafc)",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={agent.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 500ms",
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 30,
                fontWeight: 700,
                background: agent.color || "#64748b",
              }}
            >
              {agent.name[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}

        {/* Verification badge — top left */}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderRadius: 9999,
              background: status.bg,
              color: status.color,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Listings count — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 500,
            color: "#fff",
            borderRadius: 9999,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Building2 size={11} /> {agent.listings} listings
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground truncate" style={{ marginBottom: 2 }}>
          {agent.name}
          {agent.verified && (
            <span style={{ marginLeft: 4, color: "#22c55e", fontSize: 12 }}>✓</span>
          )}
        </h3>
        {agent.company && (
          <p className="text-xs text-muted truncate" style={{ marginBottom: 8 }}>{agent.company}</p>
        )}

        {/* Info row */}
        <div
          className="border-t border-border"
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 16,
            rowGap: 4,
            paddingTop: 8,
          }}
        >
          {agent.phone && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-muted, #64748b)" }}>
              <Phone size={12} /> {agent.phone}
            </span>
          )}
          {agent.years > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-muted, #64748b)" }}>
              <Clock size={12} /> {agent.years} yrs
            </span>
          )}
          {agent.areas.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-muted, #64748b)" }}>
              <MapPin size={12} /> {agent.areas.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="border-t border-border"
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--color-muted, #64748b)" }}>
          Joined{" "}
          {new Date(agent.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        {agent.rejectionReason && agent.verificationStatus === "rejected" && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#dc2626",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 160,
            }}
            title={agent.rejectionReason}
          >
            {agent.rejectionReason}
          </span>
        )}
      </div>
    </article>
  );
}
