"use client";

import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Ljust" },
  { value: "dark", label: "Mörkt" },
  { value: "system", label: "System" },
] as const;

type ThemeOption = (typeof OPTIONS)[number]["value"];

function resolveSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [selected, setSelected] = useState<ThemeOption>("system");

  useEffect(() => {
    // Reads localStorage (unavailable during server render) to sync the
    // already-applied theme into the toggle's UI state.
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  function applyTheme(value: ThemeOption) {
    setSelected(value);
    if (value === "system") {
      localStorage.removeItem("theme");
      document.documentElement.setAttribute("data-theme", resolveSystemTheme());
    } else {
      localStorage.setItem("theme", value);
      document.documentElement.setAttribute("data-theme", value);
    }
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => applyTheme(option.value)}
          className={
            "rounded-full border px-3 py-1.5 text-sm transition-colors " +
            (selected === option.value
              ? "border-foreground bg-foreground text-background"
              : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10")
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
