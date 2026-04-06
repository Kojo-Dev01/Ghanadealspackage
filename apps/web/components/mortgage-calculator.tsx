"use client";

import { useState } from "react";

type Props = { price: number };

export function MortgageCalculator({ price }: Props) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(27.5);
  const [termYears, setTermYears] = useState(15);

  const downPayment = price * (downPaymentPct / 100);
  const loanAmount = price - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0 && numPayments > 0 && loanAmount > 0) {
    monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;

  const fmt = (v: number) =>
    `GHS ${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 0 }).format(v)}`;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid var(--border-input)",
    borderRadius: "var(--radius-sm)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color var(--transition-fast)",
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-primary)",
      borderRadius: "var(--radius-lg)",
      padding: 20,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
        Mortgage Calculator
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 20 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          Down Payment (%)
          <input
            type="number"
            min={0}
            max={100}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            style={inputStyle}
          />
          <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{fmt(downPayment)}</span>
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          Interest Rate (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          Term (years)
          <input
            type="number"
            min={1}
            max={30}
            value={termYears}
            onChange={(e) => setTermYears(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
            style={inputStyle}
          />
        </label>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 16,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--red)" }}>{fmt(monthlyPayment)}</p>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly Payment</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(loanAmount)}</p>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Loan Amount</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(totalInterest)}</p>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Interest</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(totalPayment)}</p>
          <p style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Payment</p>
        </div>
      </div>

      <p style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 12 }}>
        * Estimates only. Actual rates vary by lender. Default rate reflects typical Ghana mortgage rates.
      </p>
    </div>
  );
}
