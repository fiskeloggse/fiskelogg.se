import CatchListItem from "./catch-list-item";

export type Catch = {
  id: number;
  user_id: number;
  species: string | null;
  length_cm: number | null;
  weight_kg: number | null;
  lake?: string | null;
  location?: string | null;
  bait?: string | null;
  caught_at: Date;
  angler_name?: string;
};

export default function CatchList({
  catches,
  currentUserId,
  emptyMessage = "Inga fångster loggade än. Lägg till din första fisk!",
}: {
  catches: Catch[];
  currentUserId: number;
  emptyMessage?: string;
}) {
  if (catches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
      {catches.map((item) => (
        <CatchListItem key={item.id} item={item} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}
