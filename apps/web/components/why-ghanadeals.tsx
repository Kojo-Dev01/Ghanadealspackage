import { ShieldCheck, BadgeCheck, Users, Smartphone, TrendingUp, Zap } from "lucide-react";
import type { ReactNode } from "react";

const benefits: { icon: ReactNode; title: string; description: string }[] = [
  { icon: <ShieldCheck size={28} />, title: "Secure Transactions", description: "All transactions are verified and protected" },
  { icon: <BadgeCheck size={28} />, title: "Verified Listings", description: "Every property is thoroughly verified" },
  { icon: <Users size={28} />, title: "Expert Agents", description: "Work with Ghana\u2019s most trusted real estate agents" },
  { icon: <Smartphone size={28} />, title: "Easy to Use", description: "Search, compare and enquire on any device" },
  { icon: <TrendingUp size={28} />, title: "Best Prices", description: "Get the best value for your money" },
  { icon: <Zap size={28} />, title: "Fast Service", description: "Get updates and support in real-time" },
];

export function WhyGhanaDeals() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "center" }}>
          <h2 className="section-title">Why Choose GhanaDeals</h2>
          <p className="section-subtitle">The trusted platform for property in Ghana</p>
        </div>
        <div className="why-grid" id="whyGrid">
          {benefits.map((benefit, index) => (
            <div key={index} className="why-card">
              <div className="why-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
