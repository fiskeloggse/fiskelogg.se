import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getTeamMembers, getTeamName } from "@/lib/team";
import { getOwnCatchCount } from "@/lib/catches";
import { logout } from "@/app/actions/auth";
import { leaveTeam } from "@/app/actions/team";
import {
  updateShowBingo,
  updateShowSpeciesCollection,
  updateShowFiskepass,
  updateGpsMode,
  updateQuickLogFields,
  updateShareCardFields,
} from "@/app/actions/preferences";
import {
  QUICK_LOG_FIELDS,
  QUICK_LOG_FIELD_KEYS,
  SHARE_CARD_FIELDS,
  SHARE_CARD_FIELD_KEYS,
  GPS_MODES,
} from "@/lib/constants";
import ChangePasswordForm from "@/app/components/change-password-form";
import InviteForm from "@/app/components/invite-form";
import TeamNameForm from "@/app/components/team-name-form";
import ThemeToggle from "@/app/components/theme-toggle";
import DeleteAllCatchesForm from "@/app/components/delete-all-catches-form";
import ImportCatchesToggle from "@/app/components/import-catches-toggle";

export const metadata: Metadata = {
  title: "Konto – Fisklogg",
};

export default async function KontoPage() {
  const user = await requireUser();
  const [teamMembers, teamName, catchCount] = await Promise.all([
    user.team_id ? getTeamMembers(user.team_id) : Promise.resolve([]),
    user.team_id ? getTeamName(user.team_id) : Promise.resolve(null),
    getOwnCatchCount(user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <div>
          <h2 className="text-lg font-semibold">Konto</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user.name} · {user.email}
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Logga ut
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Byt lösenord</h2>
        <ChangePasswordForm />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Tema</h2>
        <ThemeToggle />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Funktioner</h2>
        <form action={updateShowBingo} className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="show_bingo"
              defaultChecked={user.show_bingo}
            />
            Visa Utmaningar-fliken
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Spara
          </button>
        </form>

        <form action={updateShowSpeciesCollection} className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="show_species_collection"
              defaultChecked={user.show_species_collection}
            />
            Visa Artjakten (under Utmaningar)
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Spara
          </button>
        </form>

        <form action={updateShowFiskepass} className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="show_fiskepass"
              defaultChecked={user.show_fiskepass}
            />
            Visa Fiskepass
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Spara
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Loggning</h2>

        <form action={updateGpsMode} className="flex flex-col gap-3">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">GPS</legend>
            {GPS_MODES.map((mode) => (
              <label key={mode.value} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="gps_mode"
                  value={mode.value}
                  defaultChecked={user.gps_mode === mode.value}
                  className="mt-0.5"
                />
                <span>
                  {mode.label}
                  {"hint" in mode && (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {mode.hint}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Spara
          </button>
        </form>

        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/15">
          <div>
            <p className="text-sm font-medium">Snabbloggning</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Art syns alltid. Välj vilka övriga fält som alltid ska synas
              när du loggar en fångst — resten hittar du bakom &quot;Fler
              fält&quot;.
            </p>
          </div>
          <form action={updateQuickLogFields} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {QUICK_LOG_FIELDS.filter(
                (field) => field.key !== "anglerId" || teamMembers.length > 0
              ).map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="fields"
                    value={field.key}
                    defaultChecked={
                      user.quick_log_fields
                        ? user.quick_log_fields.includes(field.key)
                        : QUICK_LOG_FIELD_KEYS.includes(field.key)
                    }
                  />
                  {field.label}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Spara
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/15">
          <div>
            <p className="text-sm font-medium">Dela fångst</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Välj vilka fält som ska vara förbockade när du delar ett kort
              för en fångst — du kan alltid bocka ur eller i innan du laddar
              ner.
            </p>
          </div>
          <form action={updateShareCardFields} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {SHARE_CARD_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="fields"
                    value={field.key}
                    defaultChecked={
                      user.share_card_fields
                        ? user.share_card_fields.includes(field.key)
                        : SHARE_CARD_FIELD_KEYS.includes(field.key)
                    }
                  />
                  {field.label}
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Spara
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <div>
          <h2 className="text-lg font-semibold">Importera från Excel</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ladda ner mallen, fyll i dina fångster och ladda upp filen för
            att logga flera fångster på en gång.
          </p>
        </div>
        <ImportCatchesToggle />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">
          {teamName || "Team"}
        </h2>

        {user.team_id && <TeamNameForm currentName={teamName} />}

        {teamMembers.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {teamMembers.map((member) => (
              <li key={member.id}>
                {member.name}
                {member.id === user.id && " (du)"}
                <span className="text-zinc-500 dark:text-zinc-400">
                  {" "}
                  · {member.email}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Du har inget team än. Bjud in någon nedan för att dela fångster.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Bjud in ett konto
          </label>
          <InviteForm />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Personen måste redan ha ett konto på Fisklogg.
          </p>
        </div>

        {user.team_id && (
          <form action={leaveTeam}>
            <button
              type="submit"
              className="text-sm text-red-600 underline dark:text-red-400"
            >
              Lämna teamet
            </button>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-5 dark:border-red-900/50 dark:bg-white/5">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Farozon
        </h2>
        <DeleteAllCatchesForm catchCount={catchCount} />
      </div>
    </main>
  );
}
