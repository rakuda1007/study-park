"use client";

import { ChangeEvent, CompositionEvent, InputHTMLAttributes, useState } from "react";

const INVITE_CODE_PATTERN = /[^A-Za-z0-9]/g;

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

/** 招待コード入力（スマホで toUpperCase による二重入力を避ける） */
export function InviteCodeInput({ value, onChange, className, ...rest }: Props) {
  const [composing, setComposing] = useState(false);

  function normalize(raw: string): string {
    return raw.replace(INVITE_CODE_PATTERN, "");
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = normalize(e.target.value);
    if (composing) {
      onChange(next);
      return;
    }
    onChange(next);
  }

  function handleCompositionEnd(e: CompositionEvent<HTMLInputElement>) {
    setComposing(false);
    onChange(normalize(e.currentTarget.value));
  }

  return (
    <input
      {...rest}
      className={[className, "invite-code-input"].filter(Boolean).join(" ")}
      value={value}
      onChange={handleChange}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={handleCompositionEnd}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      inputMode="text"
      autoComplete="off"
    />
  );
}
