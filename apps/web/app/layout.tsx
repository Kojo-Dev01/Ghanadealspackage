import type { Metadata } from "next";
import { AuthProvider } from "../components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhanaDeals",
  description: "Ghana's Premier Property Marketplace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("gh-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`,
          }}
        />
        <link rel="stylesheet" href="/legacy/style.css" />
        <link rel="stylesheet" href="/legacy/admin.css" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
