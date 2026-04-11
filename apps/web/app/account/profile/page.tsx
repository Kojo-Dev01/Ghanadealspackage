"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../components/auth-provider";
import { fetchBuyerProfile, updateBuyerProfile, type UserProfile } from "../../../lib/api";

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchBuyerProfile().then((p) => {
      if (p) {
        setProfile(p);
        setName(p.name);
        setPhone(p.phone);
      }
      setFetching(false);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const updated = await updateBuyerProfile({
      name: name.trim(),
      phone: phone.trim(),
    });

    if (updated) {
      setProfile(updated);
      setMessage({ text: "Profile updated successfully!", type: "success" });
    } else {
      setMessage({ text: "Failed to update profile. Please try again.", type: "error" });
    }
    setSaving(false);
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>My Profile</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>Manage your personal information</p>
          </div>

          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
          }}>
            {/* Avatar + Email Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--border-primary)" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--red)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {(profile?.name || user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text-primary)" }}>{profile?.name || user?.name}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{profile?.email || user?.email}</div>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "var(--text-primary)" }}>Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-input)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "var(--text-primary)" }}>Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={profile?.email || user?.email || ""}
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-input)",
                    background: "var(--bg-input)",
                    color: "var(--text-tertiary)",
                    fontSize: 15,
                    cursor: "not-allowed",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, display: "block" }}>Email cannot be changed</span>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "var(--text-primary)" }}>Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-input)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
              </div>

              {message && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 16,
                  fontSize: 14,
                  background: message.type === "success" ? "var(--success-bg)" : "var(--red-light)",
                  color: message.type === "success" ? "var(--success)" : "var(--red)",
                  border: `1px solid ${message.type === "success" ? "var(--success)" : "var(--red)"}`,
                }}>
                  {message.text}
                </div>
              )}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
                style={{ width: "100%", padding: "12px", fontSize: 15, fontWeight: 600, borderRadius: "var(--radius-md)" }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
    </>
  );
}
