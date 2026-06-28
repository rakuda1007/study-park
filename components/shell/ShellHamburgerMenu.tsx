"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type ShellMenuItem = {
  label: string;
  href: string;
  title?: string;
  /** リンク直下の補足（1行） */
  hint?: string;
  /** この項目の直前に区切り線を表示 */
  dividerBefore?: boolean;
};

type Props = {
  items: ShellMenuItem[];
  /** 区切り線の下（フッター直上）に表示する項目 */
  bottomItems?: ShellMenuItem[];
  footer?: React.ReactNode;
  ariaLabel?: string;
};

function MenuLinks({
  items,
  onNavigate,
}: {
  items: ShellMenuItem[];
  onNavigate: () => void;
}) {
  return (
    <>
      {items.map((item) => (
        <li
          key={`${item.href}-${item.label}`}
          className={item.dividerBefore ? "shell-menu__item--divider" : undefined}
        >
          <Link
            href={item.href}
            className={`shell-menu__link${item.hint ? " shell-menu__link--with-hint" : ""}`}
            title={item.title}
            onClick={onNavigate}
          >
            <span className="shell-menu__link-label">{item.label}</span>
            {item.hint ? <span className="shell-menu__hint">{item.hint}</span> : null}
          </Link>
        </li>
      ))}
    </>
  );
}

export function ShellHamburgerMenu({
  items,
  bottomItems = [],
  footer,
  ariaLabel = "メニュー",
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <div className="shell-menu" ref={rootRef}>
      <button
        type="button"
        className="shell-menu__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shell-menu__bars" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>
      {open ? (
        <nav id={panelId} className="shell-menu__panel" aria-label={ariaLabel}>
          <ul className="shell-menu__list">
            <MenuLinks items={items} onNavigate={close} />
          </ul>
          {bottomItems.length > 0 ? (
            <ul className="shell-menu__list shell-menu__list--bottom">
              <MenuLinks items={bottomItems} onNavigate={close} />
            </ul>
          ) : null}
          {footer ? <div className="shell-menu__footer">{footer}</div> : null}
        </nav>
      ) : null}
    </div>
  );
}
