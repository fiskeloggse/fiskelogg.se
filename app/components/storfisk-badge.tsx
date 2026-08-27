export default function StorfiskBadge({
  size = "sm",
}: {
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full bg-blue-500 font-bold text-white " +
        (size === "md" ? "gap-1.5 px-3 py-1 text-xs" : "px-2 py-0.5 text-xs")
      }
    >
      🎣 Storfisk
    </span>
  );
}
