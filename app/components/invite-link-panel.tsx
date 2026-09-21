"use client";

import { useEffect, useState } from "react";
import { refreshInviteLink } from "@/app/actions/team";

export default function InviteLinkPanel({ token }: { token: string | null }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const url = token ? `${origin}/join/${token}` : "";

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1.5 border-t border-black/10 pt-3 dark:border-white/15">
      <p className="text-sm font-medium">Inbjudningslänk</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Skicka länken till vem som helst — den fungerar även om personen
        inte redan har ett konto på Fisklogg.
      </p>

      {token && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            {copied ? "Kopierad!" : "Kopiera"}
          </button>
        </div>
      )}

      <form action={refreshInviteLink} className="flex flex-col items-start gap-1">
        <button
          type="submit"
          className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
        >
          {token ? "Skapa ny länk" : "Skapa länk"}
        </button>
        {token && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Gör den gamla länken ogiltig.
          </p>
        )}
      </form>
    </div>
  );
}
