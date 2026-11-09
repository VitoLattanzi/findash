import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "FinDash — Terminal Financiera en Tiempo Real | Wall St, Cripto & BYMA",
  description:
    "Terminal financiera web con mapas de calor S&P 500 y Cripto, cotizaciones de acciones, ADRs argentinos, CEDEARs, Dólar MEP/CCL, Riesgo País y calendario de balances.",
  metadataBase: new URL("https://findash-ecru-one.vercel.app"),
  openGraph: {
    title: "FinDash — Terminal Financiera en Tiempo Real",
    description:
      "Monitoreo en vivo de Wall Street (S&P 500), Criptomercado 24/7, Materias Primas, ADRs Argentinos, CEDEARs, Dólar MEP/CCL y Calendario de Balances.",
    url: "https://findash-ecru-one.vercel.app",
    siteName: "FinDash",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinDash — Terminal Financiera en Tiempo Real",
    description:
      "Wall Street, Cripto 24/7, ADRs Argentinos, CEDEARs, Dólar MEP/CCL y Calendario de Balances en una sola pantalla.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
