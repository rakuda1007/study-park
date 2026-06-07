import type { ReactNode } from "react";
import type { AuthSessionKind } from "@/lib/firebase/auth-client";
import { sessionModeMeta } from "@/lib/auth/session-display";
import { SessionModeBadge } from "./SessionModeBadge";

export function SessionModeBar({
  kind,
  extra,
}: {
  kind: AuthSessionKind;
  extra?: ReactNode;
}) {
  const meta = sessionModeMeta(kind);
  return (
    <div className="session-mode-bar">
      <SessionModeBadge kind={kind} />
      <p className="session-mode-bar__hint">{meta.shellHint}</p>
      {extra ? <div className="session-mode-bar__extra">{extra}</div> : null}
    </div>
  );
}
