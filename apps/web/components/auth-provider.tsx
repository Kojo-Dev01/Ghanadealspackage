"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, AgentProfile, UserProfile, AuthResponse } from "../lib/api";
import { fetchMe, loginUser, signupUser } from "../lib/api";

const TOKEN_KEY = "gd_token";

type AuthState = {
  user: AuthUser | null;
  agent: AgentProfile | null;
  profile: UserProfile | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  signup: (data: { name: string; email: string; phone: string; password: string; accountType: "buyer" | "agent" }) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function setSession(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, agent: null, profile: null, loading: true });

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState({ user: null, agent: null, profile: null, loading: false });
      return;
    }

    fetchMe(token).then((result) => {
      if (result) {
        setState({ user: result.user, agent: result.agent, profile: result.profile ?? null, loading: false });
      } else {
        clearSession();
        setState({ user: null, agent: null, profile: null, loading: false });
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser(email, password);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    setSession(result.data);
    setState({ user: result.data.user, agent: result.data.agent, profile: result.data.profile ?? null, loading: false });
    return { ok: true as const };
  }, []);

  const signup = useCallback(async (data: { name: string; email: string; phone: string; password: string; accountType: "buyer" | "agent" }) => {
    const result = await signupUser(data);
    if (!result.ok) {
      return { ok: false as const, message: result.message };
    }
    setSession(result.data);
    setState({ user: result.data.user, agent: result.data.agent, profile: result.data.profile ?? null, loading: false });
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setState({ user: null, agent: null, profile: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
