import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { requireUser } from "@/lib/dal";
import { getCatchById } from "@/lib/register-catches";
import { getPreviousBest } from "@/lib/personal-bests";
import { getMoonPhase } from "@/lib/moon-phase";
import { WEATHER_DESCRIPTION_ICONS } from "@/lib/constants";

// Instagram's own upload standard for a portrait feed post — see the
// 2026-08-27 discussion in project memory: no reason to render bigger.
const WIDTH = 1080;
const HEIGHT = 1350;

const fontsDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
const [geistRegular, geistBold] = await Promise.all([
  readFile(join(fontsDir, "Geist-Regular.ttf")),
  readFile(join(fontsDir, "Geist-Bold.ttf")),
]);

function flag(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) !== "0";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const catchId = Number(id);
  if (!Number.isInteger(catchId)) {
    return new Response("Fångsten kunde inte hittas.", { status: 404 });
  }

  const item = await getCatchById(user.id, catchId);
  if (!item) {
    return new Response("Fångsten kunde inte hittas.", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const showSpecies = flag(searchParams, "species");
  const showMatt = flag(searchParams, "matt") && (item.length_cm != null || item.weight_kg != null);
  const showVatten = flag(searchParams, "vatten") && Boolean(item.lake);
  const showDatum = flag(searchParams, "datum");
  const showVader = flag(searchParams, "vader") && Boolean(item.weather_description);
  const showManfas = flag(searchParams, "manfas");
  const wantsPb = flag(searchParams, "pb");

  let isPersonalBest = false;
  if (wantsPb && item.species) {
    const previousBest = await getPreviousBest(item.user_id, item.species, item.id);
    isPersonalBest =
      (item.length_cm != null &&
        (previousBest.maxLength === null || item.length_cm > previousBest.maxLength)) ||
      (item.weight_kg != null &&
        (previousBest.maxWeight === null || item.weight_kg > previousBest.maxWeight));
  }

  const moonPhase = getMoonPhase(item.caught_at);
  const dateLabel = item.caught_at.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const measurementLabel = [
    item.length_cm != null ? `${item.length_cm} cm` : null,
    item.weight_kg != null ? `${item.weight_kg} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0a0a0a",
          fontFamily: "Geist",
        }}
      >
        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori JSX, not a browser <img>
          <img
            src={item.photo_url}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 340,
              background: "linear-gradient(135deg, #0b3559, #06202f)",
            }}
          >
            🐟
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 42%, rgba(0,0,0,0) 68%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 56,
            left: 64,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 36,
            fontWeight: 700,
            color: "white",
          }}
        >
          🎣 fisklogg.se
        </div>

        {isPersonalBest && (
          <div
            style={{
              position: "absolute",
              top: 52,
              right: 56,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#facc15",
              color: "#171717",
              padding: "16px 30px",
              borderRadius: 999,
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            🏆 PERSONBÄSTA
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "0 64px 64px",
          }}
        >
          {showSpecies && (
            <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: "white" }}>
              {item.species || "Okänd art"}
            </div>
          )}
          {(showMatt || showVatten) && (
            <div style={{ display: "flex", gap: 28, fontSize: 42, fontWeight: 400, color: "#f2f2f2" }}>
              {showMatt && <div style={{ display: "flex" }}>{measurementLabel}</div>}
              {showVatten && <div style={{ display: "flex" }}>📍 {item.lake}</div>}
            </div>
          )}
          {(showDatum || showVader || showManfas) && (
            <div style={{ display: "flex", gap: 28, fontSize: 32, fontWeight: 400, color: "#b5b5b5" }}>
              {showDatum && <div style={{ display: "flex" }}>{dateLabel}</div>}
              {showVader && (
                <div style={{ display: "flex" }}>
                  {WEATHER_DESCRIPTION_ICONS[item.weather_description!] ?? ""}{" "}
                  {item.weather_description}
                  {item.weather_temp_c != null ? `, ${Math.round(item.weather_temp_c)}°` : ""}
                </div>
              )}
              {showManfas && (
                <div style={{ display: "flex" }}>
                  {moonPhase.icon} {moonPhase.label}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist", data: geistBold, weight: 700, style: "normal" },
      ],
    }
  );
}
