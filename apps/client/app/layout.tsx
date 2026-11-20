import Script from "next/script";
import "./globals.css";

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
const themeScript = `(function(){try{var t=localStorage.getItem('patra-theme')||'light';document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Patra supplies its own themes. Prevent style rewriting before hydration. */}
        <meta name="darkreader-lock" />
      </head>
      <body className="min-h-full">
        <Script id="patra-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
