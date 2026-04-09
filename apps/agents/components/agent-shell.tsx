import type { ReactNode } from "react";

type AgentShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AgentShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: AgentShellProps) {
  return (
    <>
      <header className="flex items-start justify-between gap-5 max-sm:flex-col">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted max-w-xl">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </header>
      {children}
    </>
  );
}
