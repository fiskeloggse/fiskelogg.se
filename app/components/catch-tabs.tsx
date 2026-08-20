import Link from "next/link";

const ALL_TABS = [
  { href: "/", label: "Logga fisk" },
  { href: "/register", label: "Register" },
  { href: "/personbasta", label: "Personbästa" },
  { href: "/statistik", label: "Statistik" },
  { href: "/challenges", label: "Challenges" },
  { href: "/konto", label: "Konto" },
] as const;

export default function CatchTabs({
  active,
  showBingo = true,
}: {
  active: (typeof ALL_TABS)[number]["href"];
  showBingo?: boolean;
}) {
  const tabs = showBingo
    ? ALL_TABS
    : ALL_TABS.filter((tab) => tab.href !== "/challenges");
  const activeLabel = tabs.find((tab) => tab.href === active)?.label ?? "";

  return (
    <div className="border-b border-black/10 dark:border-white/15">
      {/* Mobile: dropdown menu */}
      <details className="group sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-2.5 text-sm font-medium">
          <span>{activeLabel}</span>
          <span className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500">
            ▾
          </span>
        </summary>
        <nav className="flex flex-col border-t border-black/10 pb-1 dark:border-white/15">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "px-1 py-2.5 text-sm font-medium " +
                (active === tab.href
                  ? "text-foreground"
                  : "text-zinc-500 dark:text-zinc-400")
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </details>

      {/* Desktop: horizontal tabs */}
      <nav className="hidden gap-2 sm:flex">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium " +
              (active === tab.href
                ? "border-foreground text-foreground"
                : "border-transparent text-zinc-500 hover:text-foreground dark:text-zinc-400")
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
