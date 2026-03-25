"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { ExtractedHeader } from "./extracted-header";
import { ExtractedFooter } from "./extracted-footer";
import { AuthModals } from "./auth-modals";

type ExtractedShellClientProps = {
  children: ReactNode;
};

type ToastType = "success" | "error" | "info";

type ToastRecord = {
  id: number;
  message: string;
  type: ToastType;
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>;
  }

  if (type === "error") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;
}

export function ExtractedShellClient({ children }: ExtractedShellClientProps) {
  const [activeModal, setActiveModal] = useState<"login" | "signup" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountType, setAccountType] = useState<"buyer" | "agent">("buyer");
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
      setShowBackToTop(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!activeModal && !mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal, mobileOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const openLogin = () => {
    setMobileOpen(false);
    setActiveModal("login");
  };

  const openSignup = (defaultAccountType?: "buyer" | "agent") => {
    if (defaultAccountType) setAccountType(defaultAccountType);
    setMobileOpen(false);
    setActiveModal("signup");
  };

  const closeModal = () => setActiveModal(null);
  const toggleMobileNav = () => setMobileOpen((current) => !current);
  const closeMobileNav = () => setMobileOpen(false);

  return (
    <>
      <Suspense>
        <ExtractedHeader
          headerScrolled={headerScrolled}
          mobileOpen={mobileOpen}
          onToggleMobileNav={toggleMobileNav}
          onCloseMobileNav={closeMobileNav}
          onOpenLogin={openLogin}
          onOpenSignup={openSignup}
          onShowToast={showToast}
        />
      </Suspense>
      {children}
      <ExtractedFooter />
      <AuthModals
        activeModal={activeModal}
        accountType={accountType}
        onCloseModal={closeModal}
        onOpenLogin={openLogin}
        onOpenSignup={openSignup}
        onSetAccountType={setAccountType}
        onShowToast={showToast}
      />
      <div className="toast-container" id="toastContainer">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <ToastIcon type={toast.type} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      <button
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        id="backToTop"
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
      </button>
    </>
  );
}
