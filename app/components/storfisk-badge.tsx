import { MedalIcon } from "./icons";

export default function StorfiskBadge({
  size = "sm",
}: {
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full bg-accent font-bold text-white " +
        (size === "md" ? "gap-1.5 px-3 py-1 text-xs" : "px-2 py-0.5 text-xs")
      }
    >
      <MedalIcon className="h-3.5 w-3.5" />
      Storfisk
    </span>
  );
}
