"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type ShellMenuItem = {
  label: string;
  href?: string;
  title?: string;
  /** リンクではなくメニュー内アクション（例: ログアウト） */
  action?: "logout";
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
  onLogout?: () => void | Promise<void>;
};

function itemKey(item: ShellMenuItem): string {
  return `${item.action ?? item.href ?? ""}-${item.label}`;
}

function isExternalHref(href: string | undefined): boolean {
  return !!href && /^https?:\/\//i.test(href);
}

function linkClassName(item: ShellMenuItem): string {
  return `shell-menu__link${item.hint ? " shell-menu__link--with-hint" : ""}`;
}

function LinkLabel({ item }: { item: ShellMenuItem }) {
  return (
    <>
      <span className="shell-menu__link-label">{item.label}</span>
      {item.hint ? <span className="shell-menu__hint">{item.hint}</span> : null}
    </>
  );
}

function MenuEntries({
  items,
  onNavigate,
  onLogout,
}: {
  items: ShellMenuItem[];
  onNavigate: () => void;
  onLogout?: () => void | Promise<void>;
}) {
  return (
    <>
      {items.map((item) => (
        <li
          key={itemKey(item)}
          className={item.dividerBefore ? "shell-menu__item--divider" : undefined}
        >
          {item.action === "logout" ? (
            <button
              type="button"
              className="shell-menu__link shell-menu__button"
              onClick={() => {
                onNavigate();
                void onLogout?.();
              }}
            >
              {item.label}
            </button>
          ) : isExternalHref(item.href) ? (
            <a
              href={item.href}
              className={linkClassName(item)}
              title={item.title}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
            >
              <LinkLabel item={item} />
            </a>
          ) : (
            <Link
              href={item.href ?? "#"}
              className={linkClassName(item)}
              title={item.title}
              onClick={onNavigate}
            >
              <LinkLabel item={item} />
            </Link>
          )}
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
  onLogout,
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
            <MenuEntries items={items} onNavigate={close} onLogout={onLogout} />
          </ul>
          {bottomItems.length > 0 ? (
            <ul className="shell-menu__list shell-menu__list--bottom">
              <MenuEntries items={bottomItems} onNavigate={close} onLogout={onLogout} />
            </ul>
          ) : null}
          {footer ? <div className="shell-menu__footer">{footer}</div> : null}
        </nav>
      ) : null}
    </div>
  );
}
