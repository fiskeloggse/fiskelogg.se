import Link from "next/link";

type Feature = { icon: string; title: string; text: string };

const FEATURE_GROUPS: { label: string; features: Feature[] }[] = [
  {
    label: "Loggning",
    features: [
      {
        icon: "⚡",
        title: "Logga på sekunder",
        text: "Art och längd räcker för att spara en fångst. Vikt, sjö, plats, bete, kommentar, fiskare och foto är alla valfria — du väljer vilka som visas direkt, resten göms bakom ”Fler fält”.",
      },
      {
        icon: "📍",
        title: "Position, väder och vatten — automatiskt",
        text: "Slå på vilka du vill med en ikon: spara exakt position, hämta väder, eller fyll i vattnets namn automatiskt utifrån var du står. Helt valfritt, ändras när du vill i Kontot.",
      },
      {
        icon: "📸",
        title: "Foto och delbart kort",
        text: "Lägg till en bild på fångsten och dela den som ett snyggt kort — med en automatisk ”Personbästa”-badge när det är ett nytt rekord.",
      },
    ],
  },
  {
    label: "Fiskepass",
    features: [
      {
        icon: "⏱️",
        title: "Ett pass för hela fisketuren",
        text: "Starta ett fiskepass när du ger dig ut. Sätt målart och vattentemperatur en gång, så fylls de i automatiskt på varje fångst under passet — solo eller med teamet.",
      },
      {
        icon: "🥇",
        title: "Sammanfattning direkt efter",
        text: "Se alla fångster från passet på en egen sida — plus en snabb summering per art, som ”5 gäddor, 471 cm totalt” och snittlängden.",
      },
    ],
  },
  {
    label: "Register & Statistik",
    features: [
      {
        icon: "🗺️",
        title: "Register med karta och export",
        text: "Bläddra, filtrera och sortera alla fångster och fiskepass, och visa dem på en karta. Exportera till Excel med allt — väder, vattentemperatur, månfas och vind.",
      },
      {
        icon: "📊",
        title: "Statistik & personbästa",
        text: "Se antal arter, sjöar och fiskedagar över tid. Personbästa — längsta och tyngsta — hålls koll på automatiskt för varje art.",
      },
    ],
  },
  {
    label: "Utmaningar",
    features: [
      {
        icon: "🏆",
        title: "Bingobrickor",
        text: "Skapa brickor med eget storleks- och datumintervall, solo eller med teamet. Arkivera säsongens bricka när den är klar och se hur det gick.",
      },
      {
        icon: "🎣",
        title: "Artjakten",
        text: "Jaga alla svenska fiskarter — inte bara sötvatten — och se din samling växa. Dölj arter du inte fiskar efter om du vill. Storfiskar jämförs automatiskt mot Sportfiskarnas Storfiskregister.",
      },
    ],
  },
  {
    label: "Tillsammans & tryggt",
    features: [
      {
        icon: "👥",
        title: "Fiska tillsammans",
        text: "Bjud in fiskekompisar till ett team, logga fångster åt varandra och se allas fångster sida vid sida.",
      },
      {
        icon: "🗑️",
        title: "Ångra en radering",
        text: "Fångster och fiskepass hamnar i en papperskorg innan de försvinner för gott — enkelt att återställa om du ändrar dig.",
      },
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-4 py-16 sm:px-6">
      <section className="flex flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static logo mark, not worth next/image's overhead */}
        <img src="/logo-mark.png" alt="" className="h-20 w-20" />
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-950/40 dark:text-amber-400">
          Beta
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
          Din digitala fiskedagbok
        </h1>
        <p className="max-w-xl text-balance text-zinc-500 dark:text-zinc-400">
          Logga fångster på sekunder, med väder, månfas och plats ifyllda
          automatiskt om du vill. Håll koll på statistik, samla arter, tävla
          i bingo och fiska tillsammans med laget — allt byggt för mobilen.
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
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Vi bygger vidare tillsammans med er som testar.
        </p>
      </section>

      <div className="flex flex-col gap-10">
        {FEATURE_GROUPS.map((group) => (
          <section key={group.label} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
                >
                  <span className="text-2xl" aria-hidden>
                    {feature.icon}
                  </span>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-8 text-center dark:border-white/15 dark:bg-white/5">
        <h2 className="text-xl font-semibold">Redo att börja logga?</h2>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Ta med mobilen ut till vattnet och logga första fångsten på under en
          minut.
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
