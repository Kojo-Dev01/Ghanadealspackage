export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3.5px solid var(--color-border, #e5e7eb)",
          borderTopColor: "var(--color-accent, #dc2626)",
          borderRadius: "50%",
          animation: "spin .7s linear infinite",
        }}
      />
    </div>
  );
}
