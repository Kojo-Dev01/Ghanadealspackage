"use client";

import { useState, useTransition } from "react";
import { User, Lock, CheckCircle, AlertCircle } from "lucide-react";
import type { AdminMe } from "@/lib/api";
import { updateAdminProfile, updateAdminPassword } from "./actions";

export function SettingsForm({ me }: { me: AdminMe }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <ProfileCard me={me} />
      <PasswordCard />
    </div>
  );
}

function ProfileCard({ me }: { me: AdminMe }) {
  const [name, setName] = useState(me.name);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === me.name) return;
    setResult(null);
    startTransition(async () => {
      const res = await updateAdminProfile(trimmed);
      setResult(res);
    });
  }

  return (
    <section className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <User size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <p className="text-xs text-muted">Your name and account details</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={me.email}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-secondary text-sm cursor-not-allowed"
          />
          <p className="text-xs text-muted mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Display Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Role</label>
          <span className="inline-block px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium capitalize">
            {me.role.replace(/_/g, " ")}
          </span>
        </div>
        {result && <StatusBanner ok={result.ok} message={result.message} />}
        <div className="pt-2">
          <button
            type="submit"
            disabled={pending || name.trim() === me.name || !name.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResult({ ok: false, message: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setResult({ ok: false, message: "Password must be at least 6 characters" });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await updateAdminPassword(currentPassword, newPassword);
      setResult(res);
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  return (
    <section className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          <Lock size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Password</h2>
          <p className="text-xs text-muted">Update your sign-in password</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-1">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {result && <StatusBanner ok={result.ok} message={result.message} />}
        <div className="pt-2">
          <button
            type="submit"
            disabled={pending || !currentPassword || !newPassword || !confirmPassword}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

function StatusBanner({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
        ok
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}
