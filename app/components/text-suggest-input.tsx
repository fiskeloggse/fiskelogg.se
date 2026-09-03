"use client";

import { useState } from "react";

export default function TextSuggestInput({
  id,
  name,
  value,
  onChange,
  onSelect,
  options,
  className,
  placeholder,
  required,
  showAllWhenEmpty,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  // Fires when a suggestion is explicitly clicked, instead of just filling
  // the field via onChange -- lets a caller treat a click as a confirmed
  // pick (e.g. add it to a list right away) rather than more text to edit.
  onSelect?: (value: string) => void;
  options: readonly string[];
  className: string;
  placeholder?: string;
  required?: boolean;
  // Shows already-used values (e.g. waters you've logged before) as soon as
  // the field is focused, before typing a single letter — for a list drawn
  // from the catalog rather than your own history (species), leave this off
  // so an empty field doesn't dump the whole catalog on you.
  showAllWhenEmpty?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const query = value.trim().toLowerCase();
  // Once the typed value exactly matches an option, narrow the list to just
  // that option instead of every other option that happens to contain the
  // same text — otherwise finishing "Abborre" left only "Havsabborre" in the
  // dropdown, which read as if the typed species had vanished. Hiding the
  // list entirely on an exact match had the opposite problem: finishing a
  // species with no shorter substring match (e.g. "Löja") made it look like
  // that species wasn't recognized at all.
  const exactMatch = options.some((o) => o.toLowerCase() === query);
  const matches = query
    ? exactMatch
      ? options.filter((o) => o.toLowerCase() === query)
      : options.filter((o) => o.toLowerCase().includes(query)).slice(0, 6)
    : showAllWhenEmpty
      ? options.slice(0, 20)
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
                  if (onSelect) {
                    onSelect(match);
                  } else {
                    onChange(match);
                  }
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
