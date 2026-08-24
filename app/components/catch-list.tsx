export type Catch = {
  id: number;
  user_id: number;
  species: string | null;
  length_cm: number | null;
  weight_kg: number | null;
  lake?: string | null;
  location?: string | null;
  method?: string | null;
  bait?: string | null;
  comment?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  caught_at: Date;
  angler_name?: string;
};
