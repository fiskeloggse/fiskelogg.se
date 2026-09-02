"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/register", label: "Fångster" },
  { href: "/register/fiskepass", label: "Fiskepass" },
] as const;

export default function RegisterTabs({ showFiskepass }: { showFiskepass: boolean }) {
  const pathname = usePathname();

  // Only worth showing as a choice once there's a second destination.
  if (!showFiskepass) return null;

  return (
    <nav className="flex gap-2 border-b border-black/10 dark:border-white/15">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium " +
            (pathname === tab.href
              ? "border-foreground text-foreground"
              : "border-transparent text-zinc-500 hover:text-foreground dark:text-zinc-400")
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
