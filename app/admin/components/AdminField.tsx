"use client";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
};

export default function AdminField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  placeholder,
  disabled,
  rows = 4,
}: Props) {
  const base =
    "w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white disabled:bg-zinc-50 disabled:text-zinc-400 transition-colors";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`${base} resize-y min-h-[80px]`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={base}
        />
      )}
    </div>
  );
}
