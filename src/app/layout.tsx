import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { AbstractIntlMessages } from "next-intl";
import { Inter } from "next/font/google";
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

const messagesMap: Record<Locale, AbstractIntlMessages> = {
  en: en as AbstractIntlMessages,
  fr: fr as AbstractIntlMessages,
  ja: ja as AbstractIntlMessages,
  nl: nl as AbstractIntlMessages,
  zh: zh as AbstractIntlMessages,
  es: es as AbstractIntlMessages,
  hi: hi as AbstractIntlMessages,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang={locale} className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-surface-darkest bg-grid-tech bg-grid text-slate-100 antialiased`}
      >
        <SessionProvider>
          <LocaleProvider
            locale={locale}
            messages={messages}
            timeZone={process.env.NEXT_PUBLIC_INTL_TIMEZONE ?? "America/New_York"}
          >
            {children}
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
