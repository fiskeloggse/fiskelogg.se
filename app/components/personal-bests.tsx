import type { PersonalBest } from "@/lib/personal-bests";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

export default function PersonalBests({ bests }: { bests: PersonalBest[] }) {
  return (
    <div className="flex flex-col gap-3">
      {bests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Inga personbästa än. Logga en fångst för att komma igång!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bests.map((pb) => {
            const isSameCatch =
              pb.longest && pb.heaviest && pb.longest.id === pb.heaviest.id;

            return (
              <li
                key={pb.species}
                className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5"
              >
                <p className="font-medium">{pb.species}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isSameCatch && pb.longest && pb.heaviest ? (
                    <>
                      Längst &amp; tyngst: {pb.longest.length_cm} cm ·{" "}
                      {pb.heaviest.weight_kg} kg (
                      {formatDate(pb.longest.caught_at)})
                    </>
                  ) : (
                    <>
                      {pb.longest && (
                        <>
                          Längst: {pb.longest.length_cm} cm (
                          {formatDate(pb.longest.caught_at)})
                        </>
                      )}
                      {pb.longest && pb.heaviest && " · "}
                      {pb.heaviest && (
                        <>
                          Tyngst: {pb.heaviest.weight_kg} kg (
                          {formatDate(pb.heaviest.caught_at)})
                        </>
                      )}
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
