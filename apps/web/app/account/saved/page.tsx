"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../components/auth-provider";
import { fetchSavedProperties, unsaveProperty, type SavedPropertyItem } from "../../../lib/api";

export default function SavedPropertiesPage() {
  const { user } = useAuth();

  const [properties, setProperties] = useState<SavedPropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchSavedProperties().then((result) => {
      setProperties(result.items);
      setTotal(result.total);
      setFetching(false);
    });
  }, [user]);

  const handleRemove = async (propertyId: string) => {
    setRemovingId(propertyId);
    const ok = await unsaveProperty(propertyId);
    if (ok) {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setTotal((prev) => prev - 1);
    }
    setRemovingId(null);
  };

  if (fetching) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid var(--border-primary)", borderTopColor: "var(--red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Saved Properties</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
              {total} {total === 1 ? "property" : "properties"} saved
            </p>
          </div>

          {properties.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-primary)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px", color: "var(--text-primary)" }}>No saved properties yet</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
                Browse listings and save properties you&apos;re interested in
              </p>
              <Link href="/listings" className="btn btn-primary">Browse Listings</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {properties.map((property) => (
                <div key={property.id} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-primary)", transition: "box-shadow var(--transition-fast)" }}>
                  <Link href={`/property/${property.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ position: "relative", paddingTop: "60%", background: "var(--bg-skeleton)" }}>
                      {property.image && (
                        <img
                          src={property.image}
                          alt={property.title}
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <span style={{
                        position: "absolute", top: 10, left: 10,
                        background: property.listingType === "rent" ? "var(--info)" : "var(--success)",
                        color: "#fff", padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 600, textTransform: "capitalize"
                      }}>
                        For {property.listingType}
                      </span>
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--red)", marginBottom: 4 }}>
                        {property.priceFormatted}
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.3, color: "var(--text-primary)" }}>
                        {property.title}
                      </h3>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                        {property.region} · {property.type}
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-tertiary)" }}>
                        {property.beds > 0 && <span>{property.beds} bed{property.beds !== 1 ? "s" : ""}</span>}
                        {property.baths > 0 && <span>{property.baths} bath{property.baths !== 1 ? "s" : ""}</span>}
                        {property.area > 0 && <span>{property.area} sqft</span>}
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: "0 14px 14px" }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(property.id)}
                      disabled={removingId === property.id}
                      style={{
                        width: "100%",
                        padding: "7px",
                        border: "1px solid var(--border-primary)",
                        borderRadius: "var(--radius-sm)",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--red)",
                        fontWeight: 500,
                        transition: "background var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-light)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {removingId === property.id ? "Removing..." : "Remove from Saved"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
    </>
  );
}
