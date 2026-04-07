import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./auth-provider";
import { requestPasswordReset } from "../lib/api";

type AuthModalsProps = {
  activeModal: "login" | "signup" | null;
  accountType: "buyer" | "agent";
  onCloseModal: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onSetAccountType: (type: "buyer" | "agent") => void;
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
};

export function AuthModals({
  activeModal,
  accountType,
  onCloseModal,
  onOpenLogin,
  onOpenSignup,
  onSetAccountType,
  onShowToast
}: AuthModalsProps) {
  const { login, signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await login(email, password);
    setLoading(false);

    if (!result.ok) {
      onShowToast(result.message, "error");
      return;
    }

    onCloseModal();
    onShowToast("Welcome back!", "success");
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = event.currentTarget;
    const name = (form.elements.namedItem("fullName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = "+233" + (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setLoading(false);
      onShowToast("Passwords do not match", "error");
      return;
    }

    const result = await signup({ name, email, phone, password, accountType });
    setLoading(false);

    if (!result.ok) {
      onShowToast(result.message, "error");
      return;
    }

    onCloseModal();
    onShowToast("Account created successfully!", "success");
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
              <input name="password" type="password" className="form-input" placeholder="Enter your password" required />
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
          <div className="account-type-toggle">
            <button className={accountType === "buyer" ? "active" : undefined} type="button" onClick={() => onSetAccountType("buyer")}>Buyer / Tenant</button>
            <button className={accountType === "agent" ? "active" : undefined} type="button" onClick={() => onSetAccountType("agent")}>Seller / Developer</button>
          </div>
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
              <input name="password" type="password" className="form-input" placeholder="Min 8 characters" required minLength={8} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" className="form-input" placeholder="Confirm your password" required minLength={8} />
            </div>
            <label className="checkbox-wrap" style={{ marginBottom: 20 }}>
              <input type="checkbox" required />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>I agree to the <a href="#" style={{ color: "var(--red)" }} onClick={(event) => event.preventDefault()}>Terms of Service</a> and <a href="#" style={{ color: "var(--red)" }} onClick={(event) => event.preventDefault()}>Privacy Policy</a></span>
            </label>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>
          </form>
          <div className="modal-footer">
            Already have an account? <a href="#" onClick={(event) => { event.preventDefault(); onOpenLogin(); }}>Login</a>
          </div>
        </div>
      </div>
    </>
  );
}
