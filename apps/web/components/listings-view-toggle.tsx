"use client";

import { useState } from "react";
import type { PropertyRecord } from "../lib/api";
import { ListingsMap } from "./listings-map";

type Props = {
  properties: PropertyRecord[];
  gridContent: React.ReactNode;
};

export function ListingsViewToggle({ properties, gridContent }: Props) {
  const [view, setView] = useState<"grid" | "map">("grid");

  const mappable = properties.filter((p) => p.latitude != null && p.longitude != null);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginBottom: 16 }}>
        <button
          onClick={() => setView("grid")}
          className={view === "grid" ? "btn btn-primary" : "btn btn-outline"}
          style={{ fontSize: 13, padding: "6px 14px" }}
        >
          ▦ Grid
        </button>
        <button
          onClick={() => setView("map")}
          className={view === "map" ? "btn btn-primary" : "btn btn-outline"}
          style={{ fontSize: 13, padding: "6px 14px" }}
          title={mappable.length === 0 ? "No properties have map coordinates" : undefined}
        >
          ◉ Map {mappable.length > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>({mappable.length})</span>}
        </button>
      </div>

      {view === "grid" ? (
        <>{gridContent}</>
      ) : (
        <ListingsMap properties={properties} />
      )}
    </>
  );
}
