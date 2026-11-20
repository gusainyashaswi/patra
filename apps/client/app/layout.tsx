import "./globals.css";

export const metadata = {
  title: { default: "Patra", template: "%s · Patra" },
  description: "Mail transport, templates and campaigns in one place.",
};

export const viewport = {
  themeColor: "#f1eee5",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
