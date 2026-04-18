import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./auth-provider";
import { requestPasswordReset } from "../lib/api";
import { navigateToSellerDashboard } from "../lib/sso";

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
}

type AuthModalsProps = {
  activeModal: "login" | "signup" | null;
  authIntent: "list-property" | null;
  onCloseModal: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
};

type OtpPending = {
  userId: string;
  email: string;
  name: string;
  role: string;
  verificationToken: string;
  source: "signup" | "login";
};

export function AuthModals({
  activeModal,
  authIntent,
  onCloseModal,
  onOpenLogin,
  onOpenSignup,
  onShowToast
}: AuthModalsProps) {
  const { login, signup, verifyOtp, resendOtp, cancelVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  /* ── OTP verification state ── */
  const [otpPending, setOtpPending] = useState<OtpPending | null>(null);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* Resend cooldown timer */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* Auto-focus first OTP input when OTP view appears */
  useEffect(() => {
    if (otpPending) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    }
  }, [otpPending]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...otpCode];
    next[index] = digit;
    setOtpCode(next);
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const next = [...otpCode];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtpCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async () => {
    if (!otpPending) return;
    const code = otpCode.join("");
    if (code.length !== 6) {
      onShowToast("Please enter the full 6-digit code", "error");
      return;
    }
    setOtpLoading(true);
    const result = await verifyOtp(otpPending.userId, code, otpPending.verificationToken);
    setOtpLoading(false);

    if (!result.ok) {
      onShowToast(result.message, "error");
      setOtpCode(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
      return;
    }

    onShowToast("Email verified successfully!", "success");
    setOtpPending(null);
    setOtpCode(["", "", "", "", "", ""]);
    onCloseModal();

    if (authIntent === "list-property") {
      if (otpPending.role === "agent") {
        navigateToSellerDashboard();
      } else {
        window.location.href = "/sellers/register";
      }
    }
  };

  const handleResendOtp = async () => {
    if (!otpPending || resendCooldown > 0) return;
    const result = await resendOtp(otpPending.userId, otpPending.verificationToken);
    if (result.ok) {
      // Update token since resend generates a new one
      setOtpPending((prev) => prev ? { ...prev, verificationToken: result.verificationToken } : null);
      onShowToast("New code sent to your email", "success");
      setResendCooldown(60);
      setOtpCode(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } else {
      onShowToast(result.message, "error");
    }
  };

  const handleUseDifferentEmail = async () => {
    if (!otpPending) return;
    if (otpPending.source === "signup") {
      // Delete the unverified account so they can start fresh
      await cancelVerification(otpPending.userId, otpPending.verificationToken);
    }
    setOtpPending(null);
    setOtpCode(["", "", "", "", "", ""]);
    if (otpPending.source === "login") {
      onOpenLogin();
    } else {
      onOpenSignup();
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      if ("needsVerification" in result && result.needsVerification) {
        setOtpPending({
          userId: result.userId,
          email: result.email,
          name: result.name,
          role: result.role,
          verificationToken: result.verificationToken,
          source: "login",
        });
        setResendCooldown(60);
        onShowToast("Please verify your email to continue", "info");
        return;
      }
      onShowToast(result.message, "error");
      return;
    }

    onCloseModal();
    onShowToast("Welcome back!", "success");

    if (authIntent === "list-property") {
      if (result.role === "agent") {
        navigateToSellerDashboard();
      } else {
        window.location.href = "/sellers/register";
      }
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = event.currentTarget;
    const name = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = "+233" + (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signup({ name, email, phone, password, accountType: "buyer" });
    setLoading(false);

    if (!result.ok) {
      if ("needsVerification" in result && result.needsVerification) {
        setOtpPending({
          userId: result.userId,
          email: result.email,
          name: result.name,
          role: result.role,
          verificationToken: result.verificationToken,
          source: "signup",
        });
        setResendCooldown(60);
        onShowToast("We sent a verification code to your email", "success");
        return;
      }
      if ("message" in result) onShowToast(result.message, "error");
      return;
    }

    onCloseModal();
    onShowToast("Account created successfully!", "success");

    if (authIntent === "list-property") {
      window.location.href = "/sellers/register";
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotLoading(true);
    const form = event.currentTarget;
    const email = (form.elements.namedItem("resetEmail") as HTMLInputElement).value.trim();
    const result = await requestPasswordReset(email);
    setForgotLoading(false);
    onShowToast(result.message, result.ok ? "success" : "error");
    if (result.ok) {
      setShowForgotPassword(false);
    }
  };

  /* ── OTP Verification View ── */
  const otpView = otpPending ? (
    <div className={`modal-overlay open`} onClick={() => { setOtpPending(null); onCloseModal(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={() => { setOtpPending(null); onCloseModal(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(230,57,70,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>
        <h2 className="modal-title">Verify your email</h2>
        <p className="modal-subtitle">
          We sent a 6-digit code to <strong style={{ color: "var(--text-primary)" }}>{otpPending.email}</strong>
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "24px 0" }} onPaste={handleOtpPaste}>
          {otpCode.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpInputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              style={{
                width: 48, height: 56,
                textAlign: "center",
                fontSize: 22, fontWeight: 600,
                border: "1.5px solid var(--border-primary)",
                borderRadius: 10,
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--red)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border-primary)"; }}
            />
          ))}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          disabled={otpLoading || otpCode.join("").length < 6}
          onClick={handleVerifyOtp}
        >
          {otpLoading ? "Verifying…" : "Verify Email"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-secondary)" }}>
          Didn&apos;t receive the code?{" "}
          {resendCooldown > 0 ? (
            <span style={{ color: "var(--text-tertiary)" }}>Resend in {resendCooldown}s</span>
          ) : (
            <a href="#" style={{ color: "var(--red)", fontWeight: 500 }} onClick={(e) => { e.preventDefault(); handleResendOtp(); }}>Resend Code</a>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13 }}>
          <a href="#" style={{ color: "var(--text-tertiary)" }} onClick={(e) => { e.preventDefault(); handleUseDifferentEmail(); }}>
            {otpPending.source === "login" ? "Try a different account" : "Use a different email"}
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className={`modal-overlay ${activeModal === "login" ? "open" : ""}`} id="loginModal" onClick={() => { onCloseModal(); setShowForgotPassword(false); }}>
        <div className="modal" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={() => { onCloseModal(); setShowForgotPassword(false); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          {showForgotPassword ? (
            <>
              <h2 className="modal-title">Reset Password</h2>
              <p className="modal-subtitle">Enter your email and we&apos;ll send you a reset link</p>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input name="resetEmail" type="email" className="form-input" placeholder="you@example.com" required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={forgotLoading}>{forgotLoading ? "Sending…" : "Send Reset Link"}</button>
              </form>
              <div className="modal-footer">
                Remember your password? <a href="#" onClick={(event) => { event.preventDefault(); setShowForgotPassword(false); }}>Back to Login</a>
              </div>
            </>
          ) : (
            <>
              <h2 className="modal-title">Welcome back</h2>
          <p className="modal-subtitle">Sign in to your GhanaDeals account</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" className="form-input" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input name="password" type={showLoginPw ? "text" : "password"} className="form-input" placeholder="Enter your password" required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowLoginPw((p) => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "flex" }} aria-label={showLoginPw ? "Hide password" : "Show password"}>
                  <EyeIcon visible={showLoginPw} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <label className="checkbox-wrap"><input type="checkbox" /> <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Remember me</span></label>
              <a href="#" style={{ fontSize: 13, color: "var(--red)", fontWeight: 500 }} onClick={(event) => { event.preventDefault(); setShowForgotPassword(true); }}>Forgot Password?</a>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>{loading ? "Signing in…" : "Login"}</button>
          </form>
          <div className="modal-footer">
            Don&apos;t have an account? <a href="#" onClick={(event) => { event.preventDefault(); onOpenSignup(); }}>Sign Up</a>
          </div>
            </>
          )}
        </div>
      </div>
      <div className={`modal-overlay ${activeModal === "signup" ? "open" : ""}`} id="signupModal" onClick={onCloseModal}>
        <div className="modal" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={onCloseModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <h2 className="modal-title">Create Account</h2>
          <p className="modal-subtitle">Join Ghana&apos;s largest property marketplace</p>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="fullName" type="text" className="form-input" placeholder="Kwame Asante" required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" className="form-input" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <div className="phone-input-wrap">
                <input type="text" className="phone-prefix form-input" value="+233" readOnly />
                <input name="phone" type="tel" className="form-input" placeholder="24 123 4567" required style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input name="password" type={showSignupPw ? "text" : "password"} className="form-input" placeholder="Min 8 characters" required minLength={8} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowSignupPw((p) => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "flex" }} aria-label={showSignupPw ? "Hide password" : "Show password"}>
                  <EyeIcon visible={showSignupPw} />
                </button>
              </div>
            </div>
            <label className="checkbox-wrap" style={{ marginBottom: 12 }}>
              <input type="checkbox" required />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>I agree to the <a href="#" style={{ color: "var(--red)" }} onClick={(event) => event.preventDefault()}>Terms of Service</a> and <a href="#" style={{ color: "var(--red)" }} onClick={(event) => event.preventDefault()}>Privacy Policy</a></span>
            </label>
            <label className="checkbox-wrap" style={{ marginBottom: 20 }}>
              <input type="checkbox" required />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>I consent to receiving necessary emails from GhanaDeals, including verification codes, account updates, and property notifications</span>
            </label>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>
          </form>
          <div className="modal-footer">
            Already have an account? <a href="#" onClick={(event) => { event.preventDefault(); onOpenLogin(); }}>Login</a>
          </div>
        </div>
      </div>
      {otpView}
    </>
  );
}
