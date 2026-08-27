"use client";

import { useState } from "react";

export default function TextSuggestInput({
  id,
  name,
  value,
  onChange,
  options,
  className,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  className: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const query = value.trim().toLowerCase();
  // Once the typed value exactly matches an option, hide the list entirely
  // instead of showing whatever else happens to contain the same text —
  // otherwise finishing "Abborre" left only "Havsabborre" in the dropdown,
  // which read as if the typed species had vanished.
  const exactMatch = options.some((o) => o.toLowerCase() === query);
  const matches =
    query && !exactMatch
      ? options.filter((o) => o.toLowerCase().includes(query)).slice(0, 6)
      : [];

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        className={className}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/15 dark:bg-zinc-900">
          {matches.map((match) => (
            <li key={match}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(match);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                {match}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
