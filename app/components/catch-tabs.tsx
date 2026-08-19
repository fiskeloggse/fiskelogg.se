import Link from "next/link";

const ALL_TABS = [
  { href: "/", label: "Fångster" },
  { href: "/register", label: "Register" },
  { href: "/personbasta", label: "Personbästa" },
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

  return (
    <div className="-mx-4 overflow-x-auto border-b border-black/10 px-4 sm:mx-0 sm:px-0 dark:border-white/15">
      <div className="flex w-max gap-2 sm:w-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium sm:px-4 " +
              (active === tab.href
                ? "border-foreground text-foreground"
                : "border-transparent text-zinc-500 hover:text-foreground dark:text-zinc-400")
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
