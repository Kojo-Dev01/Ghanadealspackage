"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { AgentShell } from "@/components/agent-shell";
import { apiFetch } from "@/lib/client-api";

type SavedPropertyItem = {
  id: string;
  title: string;
  listingType: string;
  price: number;
  priceFormatted: string;
  region: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  agentName: string;
};

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export default function SavedPropertiesPage() {
  const [properties, setProperties] = useState<SavedPropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/v1/buyer/saved").then(async (res) => {
      if (!res || !res.ok) {
        setFetching(false);
        return;
      }
      const data = await res.json();
      setProperties(data.items ?? []);
      setTotal(data.total ?? 0);
      setFetching(false);
    });
  }, []);

  const handleRemove = useCallback(async (propertyId: string) => {
    setRemovingId(propertyId);
    const res = await apiFetch(`/v1/buyer/saved/${propertyId}`, { method: "DELETE" });
    if (res && res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setTotal((prev) => prev - 1);
    }
    setRemovingId(null);
  }, []);

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AgentShell
      eyebrow="Properties"
      title="Saved Properties"
      description={`${total} ${total === 1 ? "property" : "properties"} saved`}
    >
      {properties.length === 0 ? (
        <div className="text-center py-16 bg-panel border border-border rounded-xl">
          <Bookmark size={48} className="mx-auto text-muted mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No saved properties yet</h3>
          <p className="text-sm text-muted mb-5">
            Browse listings and save properties you&apos;re interested in
          </p>
          <a
            href={`${WEB_URL}/listings`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Browse Listings
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-panel border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <a
                href={`${WEB_URL}/property/${property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline text-inherit"
              >
                <div className="relative pt-[60%] bg-panel-alt">
                  {property.image && (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <span
                    className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[11px] font-semibold text-white capitalize ${
                      property.listingType === "rent" ? "bg-blue-500" : "bg-green-600"
                    }`}
                  >
                    For {property.listingType}
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="font-bold text-sm text-accent mb-1">
                    {property.priceFormatted}
                  </div>
                  <h3 className="text-[13px] font-semibold text-foreground mb-1 line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="text-xs text-muted mb-1.5">
                    {property.region} · {property.type}
                  </div>
                  <div className="flex gap-2.5 text-xs text-muted">
                    {property.beds > 0 && <span>{property.beds} bed{property.beds !== 1 ? "s" : ""}</span>}
                    {property.baths > 0 && <span>{property.baths} bath{property.baths !== 1 ? "s" : ""}</span>}
                    {property.area > 0 && <span>{property.area} sqft</span>}
                  </div>
                </div>
              </a>
              <div className="px-3.5 pb-3.5">
                <button
                  type="button"
                  onClick={() => handleRemove(property.id)}
                  disabled={removingId === property.id}
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-border text-xs font-medium text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  {removingId === property.id ? "Removing..." : "Remove from Saved"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AgentShell>
  );
}
