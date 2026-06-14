type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export function ContentPinnedField({ checked, onChange, id = "content-pinned" }: Props) {
  return (
    <label className="admin-checkbox-field admin-content-pinned-field" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        常設表示（期間指定に関係なく、科目の上位に固定表示）
      </span>
    </label>
  );
}
