import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/i18n/request";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && locales.includes(cookie as Locale)) {
    return res;
  }
  // Default to English until the user picks a language in the header menu.
  res.cookies.set(LOCALE_COOKIE, defaultLocale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
