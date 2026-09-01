import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

// "/" is public too — it shows a marketing landing page to signed-out
// visitors and the dashboard to signed-in users, so it must never redirect
// either way. Only "/login" and "/signup" redirect an already-signed-in
// visitor back to "/".
const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/glomt-losenord",
  "/aterstall-losenord",
]);
const authOnlyPaths = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  const isPublicPath = publicPaths.has(pathname);

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authOnlyPaths.has(pathname) && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excludes static files generally (by extension) rather than listing each
  // one — public/ assets (images, the Excel template, generated app icons,
  // the web app manifest) must stay reachable by signed-out visitors, e.g.
  // the landing page's logo, the favicon in a browser tab, or a phone
  // reading manifest.webmanifest to build an "Add to Home Screen" icon —
  // all before anyone has logged in.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|xlsx|webmanifest)$).*)",
  ],
};
