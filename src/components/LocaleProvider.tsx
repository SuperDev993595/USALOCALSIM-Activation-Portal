"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { ReactNode } from "react";

export function LocaleProvider({
  locale,
  messages,
  timeZone,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  /** IANA zone for date formatting; avoids next-intl SSR/client mismatch. Defaults to America/New_York. */
  timeZone?: string;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone ?? "America/New_York"}>
      {children}
    </NextIntlClientProvider>
  );
}
