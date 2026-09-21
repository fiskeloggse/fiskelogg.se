import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getTeamMembers, getTeamName } from "@/lib/team";
import { getOwnCatchCount } from "@/lib/catches";
import { logout } from "@/app/actions/auth";
import { leaveTeam } from "@/app/actions/team";
import {
  updateFeatures,
  updateLoggingIcons,
  updateQuickLogFields,
  updateShareCardFields,
} from "@/app/actions/preferences";
import {
  QUICK_LOG_FIELDS,
  QUICK_LOG_FIELD_KEYS,
  SHARE_CARD_FIELDS,
  SHARE_CARD_FIELD_KEYS,
} from "@/lib/constants";
import ChangePasswordButton from "@/app/components/change-password-button";
import InviteForm from "@/app/components/invite-form";
import { LOGGING_OPTIONS } from "@/app/components/logging-icons";
import OnboardingGuide from "@/app/components/onboarding-guide";
import SaveButton from "@/app/components/save-button";
import SyncedCheckbox from "@/app/components/synced-checkbox";
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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 px-4 py-6 sm:px-6">
      <details className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Kontouppgifter
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user.name} · {user.email}
          </p>

          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Logga ut
            </button>
          </form>

          <ChangePasswordButton />

          <OnboardingGuide
            showBingo={user.show_bingo}
            showSpeciesCollection={user.show_species_collection}
            logPosition={user.log_position}
            logWeather={user.log_weather}
            fillWater={user.fill_water}
            withTrigger
          />
        </div>
      </details>

      <details className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Tema
        </summary>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </details>

      <details className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Funktioner
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <form action={updateFeatures} className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <SyncedCheckbox name="show_bingo" checked={user.show_bingo} />
              Visa Bingo (under Utmaningar)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <SyncedCheckbox
                name="show_species_collection"
                checked={user.show_species_collection}
              />
              Visa Artjakten (under Utmaningar)
            </label>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Utmaningar-fliken visas så länge minst en av dessa två är på.
            </p>
            <SaveButton />
          </form>
        </div>
      </details>

      <details className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Loggning
        </summary>
        <div className="mt-2 flex flex-col gap-4">
          <form action={updateLoggingIcons} className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Logga automatiskt</legend>
              {LOGGING_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-start gap-2 text-sm">
                  <SyncedCheckbox
                    name={option.key}
                    checked={user[option.key]}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="inline-flex items-center gap-1.5">
                      {option.label}
                      {option.icon}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {option.hint}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <SaveButton />
          </form>

          <div className="flex flex-col gap-3 border-t border-black/10 pt-2 dark:border-white/15">
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
              <SaveButton />
            </form>
          </div>

          <div className="flex flex-col gap-3 border-t border-black/10 pt-2 dark:border-white/15">
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
              <SaveButton />
            </form>
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Importera från Excel
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ladda ner mallen, fyll i dina fångster och ladda upp filen för
            att logga flera fångster på en gång.
          </p>
          <ImportCatchesToggle />
        </div>
      </details>

      <details className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Team
        </summary>

        <div className="mt-2 flex flex-col gap-3">
          {user.team_id ? (
            <ul className="flex flex-col gap-2">
              <li>
                <details className="rounded-lg border border-black/10 dark:border-white/15">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                    {teamName || "Team"}
                  </summary>
                  <div className="flex flex-col gap-3 border-t border-black/10 px-3 py-3 dark:border-white/15">
                    <TeamNameForm currentName={teamName} />

                    {teamMembers.length > 0 && (
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
                    )}

                    <div className="flex flex-col gap-1.5 border-t border-black/10 pt-3 dark:border-white/15">
                      <label htmlFor="email" className="text-sm font-medium">
                        Bjud in ett konto
                      </label>
                      <InviteForm />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Personen måste redan ha ett konto på Fisklogg.
                      </p>
                    </div>

                    <form action={leaveTeam}>
                      <button
                        type="submit"
                        className="text-sm text-red-600 underline dark:text-red-400"
                      >
                        Lämna teamet
                      </button>
                    </form>
                  </div>
                </details>
              </li>
            </ul>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Du har inget team än. Bjud in någon nedan för att dela
                fångster.
              </p>
              <label htmlFor="email" className="text-sm font-medium">
                Bjud in ett konto
              </label>
              <InviteForm />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Personen måste redan ha ett konto på Fisklogg.
              </p>
            </div>
          )}
        </div>
      </details>

      <details className="rounded-xl border border-red-200 bg-white p-3 dark:border-red-900/50 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold text-red-600 dark:text-red-400">
          Farozon
        </summary>
        <div className="mt-2">
          <DeleteAllCatchesForm catchCount={catchCount} />
        </div>
      </details>
    </main>
  );
}
