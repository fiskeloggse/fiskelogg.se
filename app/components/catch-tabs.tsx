"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ALL_TABS = [
  { href: "/", label: "Logga fisk" },
  { href: "/register", label: "Register" },
  { href: "/statistik", label: "Statistik" },
  { href: "/challenges", label: "Utmaningar" },
  { href: "/konto", label: "Konto" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabIcon({ href, className }: { href: string; className?: string }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (href) {
    case "/":
      return (
        <svg {...props}>
          <ellipse cx="13" cy="12" rx="7" ry="4.2" />
          <path d="M7.5 12 2.5 7.5v9z" strokeLinejoin="round" />
          <circle cx="17.3" cy="10.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "/register":
      return (
        <svg {...props}>
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <path d="M3.5 9.5h17M9 9.5V20" />
        </svg>
      );
    case "/statistik":
      return (
        <svg {...props}>
          <path d="M4 19h16" />
          <path d="M7.5 19v-6M12 19V6.5M16.5 19v-9" />
        </svg>
      );
    case "/challenges":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
    case "/konto":
      return (
        <svg {...props}>
          <circle cx="12" cy="8.25" r="3.25" />
          <path d="M4.75 19.5c1.4-3.8 4.7-5.75 7.25-5.75s5.85 1.95 7.25 5.75" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CatchTabs({
  showBingo = true,
}: {
  showBingo?: boolean;
}) {
  const pathname = usePathname();
  const tabs = showBingo
    ? ALL_TABS
    : ALL_TABS.filter((tab) => tab.href !== "/challenges");

  return (
    <>
      {/* Mobile: fixed bottom tab bar, centered so icons stay clear of the
          screen's rounded corners near the edges. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-4 border-t border-black/10 bg-white px-4 pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-white/15 dark:bg-zinc-950"
        aria-label="Huvudmeny"
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "flex flex-col items-center gap-1 py-2.5 text-xs leading-tight font-medium " +
                (active
                  ? "text-foreground"
                  : "text-zinc-500 dark:text-zinc-400")
              }
            >
              <TabIcon href={tab.href} className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: horizontal text tabs, centered in the space next to the
          logo (which sits shrink-0 to its left in the header row). */}
      <nav className="hidden flex-1 justify-center gap-2 sm:flex">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium " +
              (isActive(pathname, tab.href)
                ? "border-foreground text-foreground"
                : "border-transparent text-zinc-500 hover:text-foreground dark:text-zinc-400")
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
