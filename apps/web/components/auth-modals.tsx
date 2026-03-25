import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./auth-provider";

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

  return (
    <>
      <div className={`modal-overlay ${activeModal === "login" ? "open" : ""}`} id="loginModal" onClick={onCloseModal}>
        <div className="modal" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={onCloseModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <h2 className="modal-title">Welcome back</h2>
          <p className="modal-subtitle">Sign in to your GhanaDeals account</p>
          <button className="social-btn" type="button" onClick={() => onShowToast("Google login coming soon", "info")}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <button className="social-btn" type="button" onClick={() => onShowToast("Facebook login coming soon", "info")}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg>
            Continue with Facebook
          </button>
          <div className="modal-divider">or sign in with email</div>
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
              <a href="#" style={{ fontSize: 13, color: "var(--red)", fontWeight: 500 }} onClick={(event) => { event.preventDefault(); onShowToast("Password reset coming soon", "info"); }}>Forgot Password?</a>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>{loading ? "Signing in…" : "Login"}</button>
          </form>
          <div className="modal-footer">
            Don&apos;t have an account? <a href="#" onClick={(event) => { event.preventDefault(); onOpenSignup(); }}>Sign Up</a>
          </div>
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
            <button className={accountType === "agent" ? "active" : undefined} type="button" onClick={() => onSetAccountType("agent")}>Agent / Developer</button>
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
