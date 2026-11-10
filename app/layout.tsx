import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "Find out which of the roles you applied to are already closed. Built on the a16z speedrun talent network API.";

export const metadata: Metadata = {
  metadataBase: new URL("https://still-open-khaki.vercel.app"),
  title: "Still Open",
  description: DESCRIPTION,
  openGraph: {
    title: "Still Open",
    description: DESCRIPTION,
    url: "/",
    siteName: "Still Open",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Still Open",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The font variables go on <html> so :root can read them.
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
