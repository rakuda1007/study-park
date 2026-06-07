import type { AuthSessionKind } from "@/lib/firebase/auth-client";
import { sessionModeMeta } from "@/lib/auth/session-display";

export function SessionModeBadge({ kind }: { kind: AuthSessionKind }) {
  const meta = sessionModeMeta(kind);
  return (
    <span className={`session-mode-badge session-mode-badge--${kind}`}>
      {meta.badge}
    </span>
  );
}
