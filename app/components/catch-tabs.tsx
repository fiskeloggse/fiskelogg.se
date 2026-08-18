import Link from "next/link";

const TABS = [
  { href: "/", label: "Fångster" },
  { href: "/personbasta", label: "Personbästa" },
  { href: "/konto", label: "Konto" },
] as const;

export default function CatchTabs({
  active,
}: {
  active: (typeof TABS)[number]["href"];
}) {
  return (
    <div className="flex gap-2 border-b border-black/10 dark:border-white/15">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium " +
            (active === tab.href
              ? "border-foreground text-foreground"
              : "border-transparent text-zinc-500 hover:text-foreground dark:text-zinc-400")
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
