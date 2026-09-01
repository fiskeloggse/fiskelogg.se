// Minimivikter (kg) för Sportfiskarnas Storfiskregister, per art.
// Källa: https://www.sportfiskarna.se/fiske/storfiskregistret/regler-och-minimivikter/
// Arter märkta "fredad" eller som mäts i längd istället för vikt där är
// medvetet uteslutna — ingen viktgräns gäller för dem.
export const STORFISK_MIN_WEIGHT_KG: Record<string, number> = {
  Abborre: 1.6,
  Asp: 5.0,
  Berggylta: 1.4,
  Bergskädda: 0.3,
  Björkna: 0.8,
  Bleka: 4.0,
  "Blå Gaffelmakrill": 0.25,
  Blågylta: 0.55,
  Blåkäft: 0.25,
  Blåkäxa: 0.5,
  Blålånga: 0.25,
  Bonito: 0.25,
  Braxen: 4.4,
  Brunsnultra: 0.25,
  Brungylta: 0.25,
  Bäckröding: 1.0,
  Faren: 0.6,
  Fenknot: 0.35,
  Fjällbrosme: 0.25,
  Fjärsing: 0.45,
  Färna: 2.5,
  Glyskolja: 0.25,
  Gråhaj: 0.25,
  Gråsej: 6.0,
  Gräskarp: 8.0,
  Guldlax: 0.25,
  Gädda: 12.0,
  Gös: 6.5,
  Harr: 1.5,
  Havsabborre: 1.0,
  Havsbraxen: 0.25,
  Havskatt: 4.5,
  Havsmus: 0.25,
  Havsål: 0.25,
  Havsöring: 7.0,
  Hornsimpa: 0.25,
  Hågäl: 0.25,
  Ringhaj: 0.25,
  Id: 2.7,
  Indianlax: 0.25,
  Insjölax: 8.0,
  Insjööring: 6.0,
  Kanadaröding: 4.0,
  Karp: 12.0,
  Klorocka: 0.25,
  Klumpfisk: 0.25,
  Knot: 0.4,
  Kolja: 1.2,
  Kolmule: 0.25,
  Kummel: 0.25,
  Lake: 4.0,
  Lax: 14.0,
  Lerskädda: 0.25,
  Lubb: 10.0,
  Långa: 9.0,
  Makrill: 1.2,
  Marulk: 1.0,
  "Mindre Kungsfisk": 0.45,
  Mört: 0.8,
  Näbbgädda: 0.8,
  Paddtorsk: 0.3,
  Pigghaj: 5.0,
  Piggvar: 1.0,
  Puckellax: 0.25,
  Regnbåge: 6.0,
  Ruda: 1.8,
  Röding: 4.0,
  Rödknot: 0.25,
  Rödspätta: 1.4,
  Rödtunga: 0.25,
  Rötsimpa: 0.4,
  Sandskädda: 0.45,
  Sarv: 1.2,
  Sik: 2.5,
  Sill: 0.35,
  Strömming: 0.35,
  Silverruda: 1.8,
  Skoläst: 0.25,
  Skrubbskädda: 1.0,
  Skäggtorsk: 0.25,
  Slätvar: 1.0,
  Strupsnittsöring: 0.25,
  Stäm: 0.25,
  "Större Kungsfisk": 0.25,
  Sutare: 3.2,
  "Svart Smörbult": 0.25,
  "Svartmunnad Smörbult": 0.25,
  Taggmakrill: 0.4,
  "Tjockläppad Multe": 2.5,
  Torsk: 17.0,
  Tunga: 0.25,
  "Tunnläppad Multe": 0.25,
  Tånglake: 0.25,
  Vimma: 1.0,
  Vitling: 0.8,
  Vitrocka: 6.0,
  Vrakfisk: 0.25,
  Ål: 1.8,
};

export const STORFISKREGISTRET_URL =
  "https://www.sportfiskarna.se/fiske/storfiskregistret/regler-och-minimivikter/";

// Returns what percentage of the species' Storfiskregistret minimum weight
// a catch's weight represents, or null if the species has no listed
// minimum (either not in the register, protected, or measured by length).
export function getStorfiskPercent(
  species: string,
  weightKg: number
): number | null {
  const minWeight = STORFISK_MIN_WEIGHT_KG[species];
  if (!minWeight) return null;
  return (weightKg / minWeight) * 100;
}

// Species too large/dangerous to weigh reliably, where Sportfiskarna measures
// length instead — but their rules page ("Längd används") doesn't publish an
// actual minimum length, so there's no number to compare a catch against.
export const STORFISK_MEASURED_BY_LENGTH = new Set(["Håkäring", "Hälleflundra"]);

// Protected species that can't be registered in Storfiskregistret at all —
// no weight or length threshold applies to them.
export const STORFISK_PROTECTED_SPECIES = new Set([
  "Håbrand",
  "Knaggrocka",
  "Mal",
  "Sjurygg",
  "Slätrocka",
  "Småfläckig Rödhaj",
  "Staksill",
]);

export type StorfiskStatus =
  | { kind: "weight"; minWeightKg: number }
  | { kind: "length" }
  | { kind: "protected" }
  | { kind: "unlisted" };

// What Storfiskregistret criterion (if any) applies to a species — used
// everywhere a species' minimum weight is shown, so species without one get
// an accurate reason instead of just looking like missing data.
export function getStorfiskStatus(species: string): StorfiskStatus {
  const minWeightKg = STORFISK_MIN_WEIGHT_KG[species];
  if (minWeightKg != null) return { kind: "weight", minWeightKg };
  if (STORFISK_MEASURED_BY_LENGTH.has(species)) return { kind: "length" };
  if (STORFISK_PROTECTED_SPECIES.has(species)) return { kind: "protected" };
  return { kind: "unlisted" };
}
