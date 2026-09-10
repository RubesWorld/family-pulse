import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Pulse",
  description:
    "Share what your family is up to — activities, favorites, and a weekly question.",
  applicationName: "Family Pulse",
  manifest: "/manifest.json",
  // Required for iOS to treat the Home Screen shortcut as a standalone app,
  // which in turn is what makes web push work on iPhone at all.
  appleWebApp: {
    capable: true,
    title: "Family Pulse",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7e22ce",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Geist was loaded here via next/font but never applied: tailwind.config.ts
          has no fontFamily extension and globals.css sets no font rules, so
          --font-geist-sans / --font-geist-mono were declared and never read.
          Tailwind's font-sans resolved to the system stack, which is what the app
          has always rendered in. The two .woff files were still rel=preload'ed on
          every page, so 134 kB was fetched at high priority and thrown away.
          Removed — no visual change. */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
