export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
      <div className="h-24 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
      <div className="h-24 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
      <div className="h-48 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
    </main>
  );
}
