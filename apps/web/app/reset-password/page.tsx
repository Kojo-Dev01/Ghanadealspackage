"use client";

import { useState, useEffect, type FormEvent } from "react";
import { resetPassword } from "../../lib/api";

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const at = params.get("access_token") ?? "";
    const rt = params.get("refresh_token") ?? "";
    const type = params.get("type");
    if (at && rt && type === "recovery") {
      setAccessToken(at);
      setRefreshToken(rt);
      setValid(true);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters", type: "error" });
      return;
    }
    if (password !== confirm) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);
    const result = await resetPassword(accessToken, refreshToken, password);
    setLoading(false);

    if (result.ok) {
      setMessage({ text: "Password updated! Redirecting to homepage…", type: "success" });
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } else {
      setMessage({ text: result.message, type: "error" });
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary, #f5f5f5)", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 440, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Set New Password</h1>

        {!valid ? (
          <p style={{ color: "var(--text-secondary, #666)", fontSize: 14 }}>
            Invalid or expired reset link. Please request a new password reset from the login page.
          </p>
        ) : (
          <>
            <p style={{ color: "var(--text-secondary, #666)", fontSize: 14, marginBottom: 24 }}>
              Enter your new password below.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <input name="password" type="password" className="form-input" placeholder="Min 8 characters" required minLength={8} />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input name="confirmPassword" type="password" className="form-input" placeholder="Re-enter password" required minLength={8} />
              </div>
              {message && (
                <p style={{ fontSize: 14, color: message.type === "error" ? "var(--red, #e53e3e)" : "var(--green, #38a169)", marginBottom: 16 }}>
                  {message.text}
                </p>
              )}
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
