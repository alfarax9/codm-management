import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

import './globals.css'
import { Geist } from "next/font/google";
import { Toaster } from '@/components/ui/sonner'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'CODM Management',
  description: 'Manajemen scrim, statistik, dan analisis tim kompetitif Call of Duty Mobile.',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
