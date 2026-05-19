import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NavigationProgress } from "@/components/navigation-progress";
import { ThemeProvider } from "@/components/theme-provider";
import { SentryClientInit } from "@/components/sentry-client-init";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhanaDeals Seller Dashboard",
  description: "Manage your property listings, inquiries, and profile",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`try{var c=document.cookie.match(/(?:^|; )gh-theme=([^;]*)/);var t=c?c[1]:localStorage.getItem("gh-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`}</Script>
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <SentryClientInit />
        <ThemeProvider>
          <NavigationProgress />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
