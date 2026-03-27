import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { AbstractIntlMessages } from "next-intl";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { locales, defaultLocale, type Locale } from "@/i18n/request";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import de from "@/i18n/messages/de.json";
import pt from "@/i18n/messages/pt.json";
import nl from "@/i18n/messages/nl.json";

const messagesMap: Record<Locale, AbstractIntlMessages> = {
  en: en as AbstractIntlMessages,
  fr: fr as AbstractIntlMessages,
  de: de as AbstractIntlMessages,
  pt: pt as AbstractIntlMessages,
  nl: nl as AbstractIntlMessages,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "USALOCALSIM Activation",
  description: "Activate your USALOCALSIM service",
  icons: {
    icon: "https://usalocalsim.com/wp-content/uploads/2026/03/favicon-100x100.png",
  },
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
    <html lang={locale} className={`${inter.variable} ${roboto.variable}`}>
      <body className={`${inter.className} min-h-screen text-slate-100 antialiased`}>
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
