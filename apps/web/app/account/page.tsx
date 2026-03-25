"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../components/auth-provider";
import { ExtractedShell } from "../../components/extracted-shell";
import { fetchBuyerProfile, updateBuyerProfile, type UserProfile } from "../../lib/api";

const TOKEN_KEY = "gd_token";

export default function AccountPage() {
  const { user, profile: authProfile, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(authProfile);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

    fetchBuyerProfile(token).then((p) => {
      if (p) {
        setProfile(p);
        setName(p.name);
        setPhone(p.phone);
      }
    });
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setSaving(true);
    setMessage(null);

    const updated = await updateBuyerProfile(token, {
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

  if (loading) {
    return (
      <ExtractedShell>
        <main>
          <section className="section" style={{ paddingTop: 48 }}>
            <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
              <p>Loading...</p>
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
          <div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>My Account</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>Manage your profile information</p>
              </div>
              <Link href="/account/saved" className="btn btn-outline" style={{ fontSize: 14 }}>
                Saved Properties
              </Link>
            </div>

            {/* Profile Card */}
            <div style={{ background: "var(--card-bg, #fff)", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid var(--border, #eee)" }}>
              {/* Avatar + Email Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--border, #eee)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#3B82F6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                  {(profile?.name || user.name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18 }}>{profile?.name || user.name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{profile?.email || user.email}</div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSave}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border, #ddd)", fontSize: 15 }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={profile?.email || user.email}
                    disabled
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border, #ddd)", fontSize: 15, opacity: 0.6, cursor: "not-allowed" }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, display: "block" }}>Email cannot be changed</span>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Phone Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border, #ddd)", fontSize: 15 }}
                  />
                </div>

                {message && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 14,
                    background: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
                    color: message.type === "success" ? "#065F46" : "#991B1B",
                    border: `1px solid ${message.type === "success" ? "#A7F3D0" : "#FECACA"}`
                  }}>
                    {message.text}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                  style={{ width: "100%", padding: "12px", fontSize: 15, fontWeight: 600, borderRadius: 10 }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Quick Links */}
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Link
                href="/account/saved"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "var(--card-bg, #fff)", borderRadius: 12, border: "1px solid var(--border, #eee)", textDecoration: "none", color: "var(--text-primary)", fontWeight: 500, fontSize: 14, transition: "box-shadow .2s" }}
              >
                <span style={{ fontSize: 20 }}>❤️</span>
                Saved Properties
              </Link>
              <Link
                href="/listings"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "var(--card-bg, #fff)", borderRadius: 12, border: "1px solid var(--border, #eee)", textDecoration: "none", color: "var(--text-primary)", fontWeight: 500, fontSize: 14, transition: "box-shadow .2s" }}
              >
                <span style={{ fontSize: 20 }}>🏠</span>
                Browse Listings
              </Link>
            </div>
          </div>
        </section>
      </main>
    </ExtractedShell>
  );
}
