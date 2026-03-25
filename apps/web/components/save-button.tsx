"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { saveProperty, unsaveProperty } from "../lib/api";

const TOKEN_KEY = "gd_token";

type SaveButtonProps = {
  propertyId: string;
  variant?: "card" | "detail";
};

export function SaveButton({ propertyId, variant = "card" }: SaveButtonProps) {
  const { user, profile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.saved_properties?.includes(propertyId)) {
      setSaved(true);
    }
  }, [profile, propertyId]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user || user.role !== "buyer") return;

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      setBusy(true);
      if (saved) {
        const ok = await unsaveProperty(token, propertyId);
        if (ok) setSaved(false);
      } else {
        const ok = await saveProperty(token, propertyId);
        if (ok) setSaved(true);
      }
      setBusy(false);
    },
    [user, saved, propertyId]
  );

  // Don't render for non-buyer users
  if (!user || user.role !== "buyer") return null;

  if (variant === "detail") {
    return (
      <button
        type="button"
        className={`save-btn-detail ${saved ? "saved" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? "Remove from saved" : "Save property"}
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`card-heart ${saved ? "saved" : ""}`}
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save property"}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
