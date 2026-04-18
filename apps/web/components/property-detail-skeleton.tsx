/**
 * Skeleton loader for property detail page
 * Matches the exact layout and structure of the actual property detail page
 * Uses var(--border) for visibility in both light and dark modes
 */
"use client";

import { useState } from "react";
import { ExtractedHeader } from "./extracted-header";

export function PropertyDetailSkeleton() {
  const [headerScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const skeletonStyle = {
    backgroundColor: "var(--bg-skeleton)",
    animation: "skeleton-pulse 2s ease-in-out infinite",
  };

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
      
      {/* Use actual header component */}
      <ExtractedHeader
        headerScrolled={headerScrolled}
        mobileOpen={mobileOpen}
        onToggleMobileNav={() => setMobileOpen(!mobileOpen)}
        onCloseMobileNav={() => setMobileOpen(false)}
        onOpenLogin={() => {}}
        onOpenSignup={() => {}}
        onShowToast={() => {}}
      />

      <main style={{ paddingBottom: "64px" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto", paddingLeft: "24px", paddingRight: "24px" }}>
          {/* Breadcrumb skeleton */}
          <nav style={{ display: "flex", alignItems: "center", gap: "6px", padding: "14px 0 10px", marginBottom: "12px" }}>
            <div style={{ ...skeletonStyle, width: 120, height: 18, borderRadius: 4 }} />
            <div style={{ ...skeletonStyle, width: 80, height: 18, borderRadius: 4 }} />
          </nav>

          {/* Gallery Grid - 7fr main image, 3fr thumbnails on right */}
          <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "4px", borderRadius: "14px", overflow: "hidden", height: "480px", marginTop: "8px", marginBottom: "16px" }}>
            {/* Main image - large on left */}
            <div style={{ ...skeletonStyle, position: "relative", overflow: "hidden" }} />
            
            {/* Thumbnails on right - 2 images stacked vertically (top and bottom) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ ...skeletonStyle, flex: 1, position: "relative", overflow: "hidden" }} />
              <div style={{ ...skeletonStyle, flex: 1, position: "relative", overflow: "hidden" }} />
            </div>
          </div>

          {/* Additional thumbnail strip below main gallery */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ ...skeletonStyle, width: "100px", height: "64px", borderRadius: "6px" }} />
            ))}
          </div>

          {/* Detail layout - 2 column flexbox */}
          <div style={{ display: "flex", gap: "30px", marginTop: "8px" }}>
            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Price Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...skeletonStyle, width: 180, height: 40, borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ ...skeletonStyle, width: "100%", maxWidth: "400px", height: 32, borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ ...skeletonStyle, width: 200, height: 16, borderRadius: 4 }} />
                  </div>
                  <div style={{ ...skeletonStyle, width: 48, height: 48, borderRadius: 8, flexShrink: 0 }} />
                </div>
              </div>

              {/* Description Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ ...skeletonStyle, height: 18, width: 120, borderRadius: 4, marginBottom: 12 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ ...skeletonStyle, width: i === 3 ? "85%" : "100%", height: 16, borderRadius: 4 }} />
                  ))}
                </div>
              </div>

              {/* Property Details Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ ...skeletonStyle, height: 18, width: 160, borderRadius: 4, marginBottom: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ ...skeletonStyle, width: 20, height: 20, borderRadius: 3, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ ...skeletonStyle, width: 70, height: 12, borderRadius: 3, marginBottom: 6 }} />
                        <div style={{ ...skeletonStyle, width: 100, height: 14, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ ...skeletonStyle, height: 18, width: 200, borderRadius: 4, marginBottom: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid var(--bg-skeleton)", ...skeletonStyle }} />
                  ))}
                </div>
              </div>

              {/* Floor Plans Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ ...skeletonStyle, height: 18, width: 140, borderRadius: 4, marginBottom: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} style={{ ...skeletonStyle, width: "100%", height: 280, borderRadius: 10 }} />
                  ))}
                </div>
              </div>

              {/* Map Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ ...skeletonStyle, height: 18, width: 160, borderRadius: 4, marginBottom: 16 }} />
                <div style={{ ...skeletonStyle, width: "100%", height: 360, borderRadius: 10 }} />
              </div>

              {/* Mortgage Calculator Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ ...skeletonStyle, height: 18, width: 200, borderRadius: 4, marginBottom: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ ...skeletonStyle, width: "100%", height: 44, borderRadius: 6 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                    <div style={{ ...skeletonStyle, width: "100%", height: 44, borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ width: "360px", flexShrink: 0 }}>
              <div style={{ position: "sticky", top: "calc(70px + 20px)" }}>
                {/* Agent Card */}
                <div style={{ padding: "16px", border: "1px solid var(--bg-skeleton)", borderRadius: 8, marginBottom: 16, ...skeletonStyle }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ ...skeletonStyle, width: 56, height: 56, borderRadius: 999, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...skeletonStyle, width: "100%", height: 16, borderRadius: 3, marginBottom: 8 }} />
                      <div style={{ ...skeletonStyle, width: "80%", height: 14, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[...Array(2)].map((_, i) => (
                      <div key={i} style={{ ...skeletonStyle, width: "100%", height: 40, borderRadius: 6 }} />
                    ))}
                  </div>
                </div>

                {/* Inquiry Form */}
                <div style={{ padding: "20px", border: "1px solid var(--bg-skeleton)", borderRadius: 8, ...skeletonStyle }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ ...skeletonStyle, width: 70, height: 12, borderRadius: 3, marginBottom: 6 }} />
                      <div style={{ ...skeletonStyle, width: "100%", height: 40, borderRadius: 4 }} />
                    </div>
                  ))}
                  <div style={{ ...skeletonStyle, width: "100%", height: 44, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
