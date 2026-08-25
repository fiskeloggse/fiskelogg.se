"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ALL_TABS = [
  { href: "/", label: "Logga fisk" },
  { href: "/register", label: "Register" },
  { href: "/statistik", label: "Statistik" },
  { href: "/challenges", label: "Challenges" },
  { href: "/konto", label: "Konto" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
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
          <path d="M3 12c3-4.2 7.8-6.5 12.5-6.5 2 0 3.6.9 4.5 2-.9 1.4-.9 3.1 0 4.5-.9 1.1-2.5 2-4.5 2C10.8 14 6 15.5 3 12z" />
          <circle cx="16.2" cy="10.3" r="0.6" fill="currentColor" stroke="none" />
          <path d="M3 12c1 1.6 2.3 2.9 3.8 4M3 12c1-1.6 2.3-2.9 3.8-4" />
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
      {/* Mobile: fixed bottom tab bar — a top-level sibling (not nested in
          any hidden/collapsed wrapper) since position:fixed elements still
          need visible ancestors, unlike the desktop nav below. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden dark:border-white/15 dark:bg-zinc-950"
        aria-label="Huvudmeny"
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10.5px] leading-tight font-medium " +
                (active
                  ? "text-foreground"
                  : "text-zinc-500 dark:text-zinc-400")
              }
            >
              <TabIcon href={tab.href} className="h-[18px] w-[18px]" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: horizontal tabs, with the divider line under the header's
          top row that the mobile version doesn't need (it has its own bar). */}
      <div className="mx-auto hidden max-w-4xl border-t border-black/10 px-4 sm:block sm:px-6 dark:border-white/10">
        <nav className="flex gap-2">
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
      </div>
    </>
  );
}
