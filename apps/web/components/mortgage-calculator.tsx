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

  const inputCls =
    "border border-border rounded-lg bg-panel-alt px-3 py-2 text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 w-full";

  return (
    <div className="bg-panel border border-border rounded-xl p-5">
      <h2 className="text-lg font-bold text-foreground mb-4">Mortgage Calculator</h2>

      <div className="grid gap-4 sm:grid-cols-3 mb-5">
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Down Payment (%)
          <input
            type="number"
            min={0}
            max={100}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className={inputCls}
          />
          <span className="text-[10px] text-muted/60">{fmt(downPayment)}</span>
        </label>

        <label className="grid gap-1 text-xs font-semibold text-muted">
          Interest Rate (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className={inputCls}
          />
        </label>

        <label className="grid gap-1 text-xs font-semibold text-muted">
          Term (years)
          <input
            type="number"
            min={1}
            max={30}
            value={termYears}
            onChange={(e) => setTermYears(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-panel-alt border border-border rounded-lg p-4">
        <div className="text-center">
          <p className="text-lg font-bold text-accent">{fmt(monthlyPayment)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wide">Monthly Payment</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{fmt(loanAmount)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wide">Loan Amount</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{fmt(totalInterest)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wide">Total Interest</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{fmt(totalPayment)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wide">Total Payment</p>
        </div>
      </div>

      <p className="text-[10px] text-muted mt-3">
        * Estimates only. Actual rates vary by lender. Default rate reflects typical Ghana mortgage rates.
      </p>
    </div>
  );
}
