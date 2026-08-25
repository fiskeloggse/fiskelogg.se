"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// "Logga fisk" isn't listed here — the Fisklogg logo in the header is the
// only link to it, so it's never duplicated in the tab menu.
const ALL_TABS = [
  { href: "/register", label: "Register" },
  { href: "/statistik", label: "Statistik" },
  { href: "/challenges", label: "Challenges" },
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
      {/* Mobile: icon tab row, sharing the header's top row with the logo.
          flex-1 fills the space next to the logo, and centering within
          that (rather than across the whole screen) keeps icons clear of
          the physical screen edges near the top corners. */}
      <nav
        className="flex flex-1 justify-center gap-x-5 sm:hidden"
        aria-label="Huvudmeny"
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "flex flex-col items-center gap-0.5 text-[10.5px] leading-tight font-medium " +
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

      {/* Desktop: horizontal text tabs, right after the logo. */}
      <nav className="hidden flex-1 gap-2 sm:flex">
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
