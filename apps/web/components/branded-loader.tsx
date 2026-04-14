/* eslint-disable @next/next/no-img-element */

/**
 * Full-screen branded loading screen — pulsing GhanaDeals logo
 * with a spinning red border ring.
 */
export function BrandedLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      {/* Outer ring container */}
      <div
        style={{
          position: "relative",
          width: 68,
          height: 68,
        }}
      >
        {/* Spinning border ring */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid rgba(230, 57, 70, 0.15)",
            borderTopColor: "#e63946",
            animation: "gdSpin 0.9s linear infinite",
          }}
        />
        {/* Logo centered inside */}
        <img
          src="/legacy/assets/favicon.jpeg"
          alt=""
          width={56}
          height={56}
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
      <style>{`
        @keyframes gdSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
