import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["600", "700", "800", "900"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: { default: "Patra", template: "%s · Patra" },
  description: "Mail transport, templates and campaigns in one place.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1eee5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
};

// Sets the theme before first paint so there is no light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('patra-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Script id="patra-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
