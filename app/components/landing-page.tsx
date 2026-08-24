import Link from "next/link";

const FEATURES = [
  {
    icon: "⚡",
    title: "Logga på sekunder",
    text: "Art och längd räcker för att spara en fångst. Vikt, sjö, plats, bete, kommentar, fiskare och GPS-position är alla valfria fält — du väljer själv vilka som visas direkt när du loggar, och vilka som göms bakom ”Fler fält”.",
  },
  {
    icon: "📍",
    title: "GPS-position, helt frivilligt",
    text: "Bifoga automatiskt var du stod när du loggar, eller sätt platsen på en karta i efterhand. Vill du inte dela position alls? Stäng av det i Kontot när som helst.",
  },
  {
    icon: "🗺️",
    title: "Register med karta",
    text: "Bläddra, filtrera och sortera alla dina fångster. Visa dem direkt på en karta utifrån det du filtrerat fram — ingen extern karttjänst behövs.",
  },
  {
    icon: "📊",
    title: "Statistik & personbästa",
    text: "Se antal arter, sjöar och fiskedagar över tid, och håll automatiskt koll på ditt personbästa — längsta och tyngsta — för varje art.",
  },
  {
    icon: "🏆",
    title: "Egna utmaningar",
    text: "Skapa bingobrickor med eget storleks- och datumintervall. Kör solo eller tävla med teamet om vem som fyller brickan först.",
  },
  {
    icon: "👥",
    title: "Fiska tillsammans",
    text: "Bjud in fiskekompisar till ett team, logga fångster åt varandra och se allas fångster sida vid sida.",
  },
  {
    icon: "🗑️",
    title: "Ångra en radering",
    text: "Fångster hamnar i papperskorgen innan de försvinner för gott — enkelt att återställa om du ändrar dig.",
  },
  {
    icon: "🌓",
    title: "Ljust eller mörkt",
    text: "Följer systemets tema automatiskt, eller välj själv i Kontot.",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-4 py-16 sm:px-6">
      <section className="flex flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static logo mark, not worth next/image's overhead */}
        <img src="/logo-mark.png" alt="" className="h-20 w-20" />
        <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
          Din digitala fiskedagbok
        </h1>
        <p className="max-w-xl text-balance text-zinc-500 dark:text-zinc-400">
          Logga fångster på sekunder, se statistik över tid och tävla mot dig
          själv eller ditt fiskelag. Fisklogg är byggt för mobilen, med fält
          du själv väljer om du vill använda — inte formulär du tvingas fylla
          i.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Skapa konto
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Logga in
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
          >
            <span className="text-2xl" aria-hidden>
              {feature.icon}
            </span>
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {feature.text}
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-8 text-center dark:border-white/15 dark:bg-white/5">
        <h2 className="text-xl font-semibold">Redo att börja logga?</h2>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Gratis att komma igång. Ta med mobilen ut till vattnet och logga
          första fångsten på under en minut.
        </p>
        <Link
          href="/signup"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Skapa konto
        </Link>
      </section>
    </main>
  );
}
