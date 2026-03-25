export function WhyGhanaDeals() {
  const benefits = [
    {
      icon: "🔒",
      title: "Secure Transactions",
      description: "All transactions are verified and protected"
    },
    {
      icon: "✓",
      title: "Verified Listings",
      description: "Every property is thoroughly verified"
    },
    {
      icon: "👥",
      title: "Expert Agents",
      description: "Work with Ghana's most trusted agents"
    },
    {
      icon: "📱",
      title: "Easy to Use",
      description: "Search, compare and book on any device"
    },
    {
      icon: "💰",
      title: "Best Prices",
      description: "Get the best value for your money"
    },
    {
      icon: "🚀",
      title: "Fast Service",
      description: "Get updates and support in real-time"
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{textAlign: "center"}}>
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
