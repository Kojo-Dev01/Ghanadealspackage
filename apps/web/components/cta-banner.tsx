"use client";

import { useAuth } from "./auth-provider";

export function CTABanner() {
  const { user } = useAuth();

  function handleClick() {
    if (user && user.role === "agent") {
      window.location.href = process.env.NEXT_PUBLIC_SELLERS_URL || "http://localhost:3002";
    } else if (user) {
      window.location.href = "/sellers/register";
    } else {
      window.dispatchEvent(new Event("gd:open-login"));
    }
  }

  return (
    <section style={{ padding: "0 0 64px" }}>
      <div className="container">
        <div className="cta-banner">
          <div>
            <h2>Are you a property professional?</h2>
            <p>List your properties and reach thousands of potential buyers and tenants</p>
          </div>
          <button type="button" onClick={handleClick} className="btn btn-primary btn-lg">
            List Your Property
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
