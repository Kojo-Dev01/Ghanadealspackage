import Link from "next/link";

export function CTABanner() {
  return (
    <section style={{ padding: "0 0 64px" }}>
      <div className="container">
        <div className="cta-banner">
          <div>
            <h2>Are you a property professional?</h2>
            <p>List your properties and reach thousands of potential buyers and tenants</p>
          </div>
          <Link href="/listings" className="btn btn-primary btn-lg">
            List Your Property
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
