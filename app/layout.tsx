import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"
import { ToastProvider } from "./components/Toast"
import { LangProvider } from "@/lib/i18n"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = 'https://sheikstream.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SheikSTREAM – Hub para Streamers Brasileiros',
    template: '%s | SheikSTREAM',
  },
  description:
    'SheikSTREAM é o hub completo para streamers brasileiros: alertas ao vivo, overlays personalizados, integrações com Twitch, YouTube, Kick e Livepix, tudo em um só lugar.',
  keywords: [
    'streamer', 'streaming', 'brasil', 'twitch', 'youtube', 'kick',
    'overlay', 'alerta', 'livepix', 'doação', 'sub', 'notificação',
    'dashboard streamer', 'ferramentas streaming',
  ],
  authors: [{ name: 'SheikSTREAM', url: SITE_URL }],
  creator: 'SheikSTREAM',
  publisher: 'SheikSTREAM',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'SheikSTREAM',
    title: 'SheikSTREAM – Hub para Streamers Brasileiros',
    description:
      'Alertas ao vivo, overlays, integrações com Twitch, YouTube, Kick e Livepix. Tudo que o streamer brasileiro precisa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SheikSTREAM – Hub para Streamers Brasileiros',
    description:
      'Alertas ao vivo, overlays, integrações com Twitch, YouTube, Kick e Livepix.',
    site: '@sheikstream',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><LangProvider><Providers><ToastProvider>{children}</ToastProvider></Providers></LangProvider></body>
    </html>
  );
}
