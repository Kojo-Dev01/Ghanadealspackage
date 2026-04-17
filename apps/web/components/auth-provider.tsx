"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, AgentProfile, UserProfile } from "../lib/api";

type AuthState = {
  user: AuthUser | null;
  agent: AgentProfile | null;
  profile: UserProfile | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<{ ok: true; role: string } | { ok: false; message: string } | { ok: false; needsVerification: true; userId: string; email: string; name: string; role: string; verificationToken: string; message: string }>;
  signup: (data: { name: string; email: string; phone: string; password: string; accountType: "buyer" | "agent" }) => Promise<{ ok: true } | { ok: false; message: string } | { ok: false; needsVerification: true; userId: string; email: string; name: string; role: string; verificationToken: string }>;
  verifyOtp: (userId: string, code: string, verificationToken: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  resendOtp: (userId: string, verificationToken: string) => Promise<{ ok: true; email: string; verificationToken: string } | { ok: false; message: string }>;
  cancelVerification: (userId: string, verificationToken: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  upgrade: (data: { company?: string; phone?: string; areas?: string[] }) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, agent: null, profile: null, loading: true });

  // Restore session on mount via httpOnly cookie
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setState({ user: data.user, agent: data.agent, profile: data.profile ?? null, loading: false });
        } else {
          setState({ user: null, agent: null, profile: null, loading: false });
        }
      })
      .catch(() => {
        setState({ user: null, agent: null, profile: null, loading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.needsVerification) {
        return {
          ok: false as const,
          needsVerification: true as const,
          userId: json.userId as string,
          email: json.email as string,
          name: json.name as string,
          role: json.role as string,
          verificationToken: json.verificationToken as string,
          message: json.message as string,
        };
      }
      if (!res.ok || !json.ok) {
        return { ok: false as const, message: json.message ?? "Login failed" };
      }
      setState({ user: json.data.user, agent: json.data.agent, profile: json.data.profile ?? null, loading: false });
      return { ok: true as const, role: json.data.user.role as string };
    } catch {
      return { ok: false as const, message: "Network error — please try again" };
    }
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; phone: string; password: string; accountType: "buyer" | "agent" }) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.needsVerification) {
        return {
          ok: false as const,
          needsVerification: true as const,
          userId: json.userId as string,
          email: json.email as string,
          name: json.name as string,
          role: json.role as string,
          verificationToken: json.verificationToken as string,
        };
      }
      if (!res.ok || !json.ok) {
        return { ok: false as const, message: json.message ?? "Signup failed" };
      }
      setState({ user: json.data.user, agent: json.data.agent, profile: json.data.profile ?? null, loading: false });
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "Network error — please try again" };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    setState({ user: null, agent: null, profile: null, loading: false });
  }, []);

  const verifyOtp = useCallback(async (userId: string, code: string, verificationToken: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, code, verificationToken }),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        return { ok: false as const, message: json.message ?? "Verification failed" };
      }
      setState({ user: json.data.user, agent: json.data.agent, profile: json.data.profile ?? null, loading: false });
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "Network error — please try again" };
    }
  }, []);

  const resendOtp = useCallback(async (userId: string, verificationToken: string) => {
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, verificationToken }),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        return { ok: false as const, message: json.message ?? "Failed to resend code" };
      }
      return { ok: true as const, email: json.email as string, verificationToken: json.verificationToken as string };
    } catch {
      return { ok: false as const, message: "Network error — please try again" };
    }
  }, []);

  const cancelVerification = useCallback(async (userId: string, verificationToken: string) => {
    try {
      const res = await fetch("/api/auth/cancel-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, verificationToken }),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        return { ok: false as const, message: json.message ?? "Failed to cancel" };
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "Network error — please try again" };
    }
  }, []);

  const upgrade = useCallback(async (data: { company?: string; phone?: string; areas?: string[] }) => {
    try {
      const res = await fetch("/api/auth/upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        return { ok: false as const, message: json.message ?? "Upgrade failed" };
      }
      setState((prev) => ({
        ...prev,
        user: json.data.user,
        agent: json.data.agent,
      }));
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "Network error — please try again" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, verifyOtp, resendOtp, cancelVerification, logout, upgrade }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
