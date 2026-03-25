"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/auth-provider";
import { ExtractedShell } from "../../../components/extracted-shell";
import { fetchSavedProperties, unsaveProperty, type SavedPropertyItem } from "../../../lib/api";

const TOKEN_KEY = "gd_token";

export default function SavedPropertiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<SavedPropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user && user.role !== "buyer") {
      router.push("/");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    fetchSavedProperties(token).then((result) => {
      setProperties(result.items);
      setTotal(result.total);
      setFetching(false);
    });
  }, [user, loading, router]);

  const handleRemove = async (propertyId: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setRemovingId(propertyId);
    const ok = await unsaveProperty(token, propertyId);
    if (ok) {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setTotal((prev) => prev - 1);
    }
    setRemovingId(null);
  };

  if (loading || fetching) {
    return (
      <ExtractedShell>
        <main>
          <section className="section" style={{ paddingTop: 48 }}>
            <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
              <p>Loading saved properties...</p>
            </div>
          </section>
        </main>
      </ExtractedShell>
    );
  }

  if (!user || user.role !== "buyer") return null;

  return (
    <ExtractedShell>
      <main>
        <section className="section" style={{ paddingTop: 48 }}>
          <div className="container">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Saved Properties</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
                  {total} {total === 1 ? "property" : "properties"} saved
                </p>
              </div>
              <Link href="/account" className="btn btn-outline" style={{ fontSize: 14 }}>
                My Account
              </Link>
            </div>

            {properties.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--card-bg, #fff)", borderRadius: 16, border: "1px solid var(--border, #eee)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>No saved properties yet</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
                  Browse listings and save properties you&apos;re interested in
                </p>
                <Link href="/listings" className="btn btn-primary">Browse Listings</Link>
              </div>
            ) : (
              <div className="property-grid">
                {properties.map((property) => (
                  <div key={property.id} style={{ background: "var(--card-bg, #fff)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border, #eee)", transition: "box-shadow .2s" }}>
                    <Link href={`/property/${property.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ position: "relative", paddingTop: "60%", background: "#f0f0f0" }}>
                        {property.image && (
                          <img
                            src={property.image}
                            alt={property.title}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                        <span style={{
                          position: "absolute", top: 12, left: 12,
                          background: property.listingType === "rent" ? "#3B82F6" : "#10B981",
                          color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: "capitalize"
                        }}>
                          For {property.listingType}
                        </span>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--red, #c00)", marginBottom: 4 }}>
                          {property.priceFormatted}
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", lineHeight: 1.3 }}>
                          {property.title}
                        </h3>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                          {property.region} &middot; {property.type}
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                          {property.beds > 0 && <span>{property.beds} bed{property.beds !== 1 ? "s" : ""}</span>}
                          {property.baths > 0 && <span>{property.baths} bath{property.baths !== 1 ? "s" : ""}</span>}
                          {property.area > 0 && <span>{property.area} sqft</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                          Agent: {property.agentName}
                        </div>
                      </div>
                    </Link>
                    <div style={{ padding: "0 16px 16px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemove(property.id)}
                        disabled={removingId === property.id}
                        style={{
                          width: "100%", padding: "8px", border: "1px solid var(--border, #ddd)",
                          borderRadius: 8, background: "transparent", cursor: "pointer",
                          fontSize: 13, color: "#DC2626", fontWeight: 500, transition: "background .2s"
                        }}
                      >
                        {removingId === property.id ? "Removing..." : "Remove from Saved"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </ExtractedShell>
  );
}
