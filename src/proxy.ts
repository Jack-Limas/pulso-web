import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { isApiError, refresh } from "@/lib/session/api-auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session/constants";
import { clearSession, writeSession } from "@/lib/session/cookies";

function preferredLocale(request: NextRequest): string {
  const accepted = request.headers.get("accept-language") ?? "";
  return accepted.toLowerCase().startsWith("en") ? "en" : DEFAULT_LOCALE;
}

/** Puts every page under a locale and keeps the session fresh before private pages render. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, first = "", second] = pathname.split("/");

  if (!isLocale(first)) {
    const url = new URL(`/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`, request.url);
    url.search = search;
    return NextResponse.redirect(url);
  }

  const isPrivate = second === "app";
  const isAuthPage = second === "login" || second === "register";
  const hasAccess = request.cookies.has(ACCESS_COOKIE);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (isAuthPage && (hasAccess || refreshToken)) {
    return NextResponse.redirect(new URL(`/${first}/app/dashboard`, request.url));
  }
  if (!isPrivate || hasAccess) {
    return NextResponse.next();
  }

  const loginUrl = new URL(`/${first}/login`, request.url);
  loginUrl.searchParams.set("next", pathname);
  if (!refreshToken) {
    return NextResponse.redirect(loginUrl);
  }
  const session = await refresh(refreshToken);
  if (isApiError(session)) {
    return clearSession(NextResponse.redirect(loginUrl));
  }
  // The page renders in this same request, so it must see the new token right away.
  request.cookies.set(ACCESS_COOKIE, session.accessToken);
  return writeSession(NextResponse.next({ request }), session);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
