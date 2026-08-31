import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/app/components/header";
import { getCurrentUser } from "@/lib/dal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fisklogg",
  description: "Logga dina fångster – art, längd, vikt och tid.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    function storedTheme() {
      var v = localStorage.getItem("theme");
      return v === "light" || v === "dark" ? v : null;
    }
    function apply() {
      var theme = storedTheme() || (media.matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
      // Belt-and-suspenders: paints the background via an inline style too,
      // not just the data-theme attribute + stylesheet rule. Doesn't help
      // when the stylesheet itself is still loading (nothing paints until
      // then regardless — see the Ljust/Mörkt/System discussion), but on a
      // warm cache where CSS resolves instantly this avoids any dependency
      // on stylesheet application order for at least the background color.
      document.documentElement.style.backgroundColor =
        theme === "dark" ? "#0a0a0a" : "#ffffff";
    }
    apply();
    // Without an explicit Ljust/Mörkt choice, "System" should track the
    // OS theme live — otherwise a tab left open across e.g. iOS's
    // automatic sunset/sunrise switch shows a stale theme until the next
    // full reload, which looks like the app randomly changing color.
    media.addEventListener("change", function () {
      if (!storedTheme()) apply();
    });
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={
          "min-h-full flex flex-col bg-zinc-50 dark:bg-black" +
          // Room for the fixed mobile bottom tab bar so page content never
          // sits underneath it — desktop uses the regular in-flow tabs, no
          // extra padding needed there.
          (user ? " pb-20 sm:pb-0" : "")
        }
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
