import type { ReactNode } from "react";
import { ExtractedShellClient } from "./extracted-shell-client";

type ExtractedShellProps = {
  children: ReactNode;
};

export function ExtractedShell({ children }: ExtractedShellProps) {
  return <ExtractedShellClient>{children}</ExtractedShellClient>;
}
