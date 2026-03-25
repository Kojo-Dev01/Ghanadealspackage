import Link from "next/link";
import Image from "next/image";

export function ExtractedFooter() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

  return (
    <footer className="site-footer" id="siteFooter">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <Image src="/legacy/assets/favicon.jpeg" alt="GhanaDeals Logo" width={32} height={32} style={{ objectFit: "contain", borderRadius: 4 }} />
              Ghana<span>Deals</span>
            </Link>
            <p>Ghana&apos;s premier property marketplace connecting buyers, sellers, and agents across all 16 regions.</p>
          </div>
          <div className="footer-col">
            <h4>Buy Property</h4>
            <Link href="/listings?listingType=sale">Apartments for Sale</Link>
            <Link href="/listings?listingType=sale">Houses for Sale</Link>
            <Link href="/listings?listingType=sale">Land for Sale</Link>
          </div>
          <div className="footer-col">
            <h4>Rent Property</h4>
            <Link href="/listings?listingType=rent">Apartments for Rent</Link>
            <Link href="/listings?listingType=rent">Office Spaces</Link>
            <Link href="/listings?listingType=rent">Warehouses</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href={adminUrl}>Admin</a>
            <Link href="/agents">Find Agents</Link>
            <Link href="/">Home</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 GhanaDeals. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
