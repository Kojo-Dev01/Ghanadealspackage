"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";

export function UserActionsDropdown({
  userId,
  query,
  page,
  suspended,
  suspendAction,
  unsuspendAction,
  deleteAction,
}: {
  userId: string;
  query: string;
  page: string;
  suspended: boolean;
  suspendAction: (formData: FormData) => void;
  unsuspendAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleSuspend() {
    const reason = prompt("Reason for suspension (optional):");
    if (reason === null) return;
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("q", query);
    fd.set("page", page);
    fd.set("reason", reason);
    setOpen(false);
    suspendAction(fd);
  }

  function handleUnsuspend() {
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("q", query);
    fd.set("page", page);
    setOpen(false);
    unsuspendAction(fd);
  }

  function handleDelete() {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("q", query);
    fd.set("page", page);
    setOpen(false);
    deleteAction(fd);
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-panel-alt transition-colors cursor-pointer"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 9999 }}>
          <div className="w-44 bg-panel border border-border rounded-lg shadow-2xl overflow-hidden">
            {suspended ? (
              <button
                type="button"
                onClick={handleUnsuspend}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-green-600 hover:bg-panel-alt transition-colors cursor-pointer"
              >
                <ShieldCheck size={15} />
                Unsuspend User
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSuspend}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-amber-600 hover:bg-panel-alt transition-colors cursor-pointer"
              >
                <ShieldOff size={15} />
                Suspend User
              </button>
            )}
            <div className="mx-3 h-px bg-foreground/10" />
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-sm text-red-500 hover:bg-panel-alt transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
              Delete User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
