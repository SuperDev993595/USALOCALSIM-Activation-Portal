import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { locales, defaultLocale, type Locale } from "@/i18n/request";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import ja from "@/i18n/messages/ja.json";
import nl from "@/i18n/messages/nl.json";
import zh from "@/i18n/messages/zh.json";
import es from "@/i18n/messages/es.json";
import hi from "@/i18n/messages/hi.json";

const messagesMap: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  fr: fr as Record<string, unknown>,
  ja: ja as Record<string, unknown>,
  nl: nl as Record<string, unknown>,
  zh: zh as Record<string, unknown>,
  es: es as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
};

export const metadata: Metadata = {
  title: "USALOCALSIM Activation",
  description: "Activate your USALOCALSIM service",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = localeCookie && locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : defaultLocale;
  const messages = messagesMap[locale] ?? messagesMap.en;

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-50 antialiased">
        <SessionProvider>
          <LocaleProvider locale={locale} messages={messages}>
            {children}
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
