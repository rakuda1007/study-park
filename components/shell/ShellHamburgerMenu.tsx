"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type ShellMenuItem = {
  label: string;
  href: string;
  title?: string;
};

type Props = {
  items: ShellMenuItem[];
  footer?: React.ReactNode;
  ariaLabel?: string;
};

export function ShellHamburgerMenu({
  items,
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
            {items.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className="shell-menu__link"
                  title={item.title}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {footer ? <div className="shell-menu__footer">{footer}</div> : null}
        </nav>
      ) : null}
    </div>
  );
}
