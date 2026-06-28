"use client";

import type { AuthSessionKind } from "@/lib/firebase/auth-client";
import { SessionModeBadge } from "./SessionModeBadge";

type Props = {
  kind: AuthSessionKind;
  canSwitch?: boolean;
  onSwitch?: () => void;
};

export function SessionModeSwitcher({ kind, canSwitch = false, onSwitch }: Props) {
  const otherLabel = kind === "admin" ? "クリエイター" : "管理者";

  return (
    <div className="session-mode-switcher">
      <SessionModeBadge kind={kind} />
      {canSwitch && onSwitch ? (
        <button
          type="button"
          className="session-mode-switcher__btn"
          onClick={onSwitch}
          title={`${otherLabel}モードに切り替え`}
        >
          {otherLabel}へ
        </button>
      ) : null}
    </div>
  );
}
