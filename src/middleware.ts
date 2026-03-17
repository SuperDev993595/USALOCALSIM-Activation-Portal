import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLocaleFromAcceptLanguage, getLocaleFromCountry, locales, type Locale } from "@/i18n/request";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && locales.includes(cookie as Locale)) {
    return res;
  }
  const geoCountry =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country-code") ??
    null;
  const localeFromGeo = getLocaleFromCountry(geoCountry);
  const locale: Locale =
    localeFromGeo ?? getLocaleFromAcceptLanguage(req.headers.get("accept-language"));
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
