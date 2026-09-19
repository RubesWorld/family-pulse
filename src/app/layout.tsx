import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import { splashLinks } from "@/lib/ios-splash";

// main removed the Geist fonts because they were loaded and never applied —
// nothing read --font-geist-sans, so 134 kB was preloaded and thrown away on
// every page. These two replace them and are genuinely wired up:
// tailwind.config.ts maps font-display and font-body onto these variables.
//
// Fraunces carries the things people wrote — activity titles, questions,
// answers. Nunito handles chrome, meta and controls.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

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
    statusBarStyle: "black-translucent",
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
  // Matches --paper in each theme so the iOS status bar blends in.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#17110C" },
    { media: "(prefers-color-scheme: light)", color: "#FDF6EC" },
  ],
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
    <html lang="en" data-theme="night" suppressHydrationWarning>
      <head>
        {/* Resolves the stored/system theme before first paint so the
            app never flashes the wrong paper colour. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* iOS launch images. The Metadata API has no field for this link
            type, so they go here. See src/lib/ios-splash.ts for why there
            are so many and which devices each covers. */}
        {splashLinks().map(({ media, href }) => (
          <link
            key={href + media}
            rel="apple-touch-startup-image"
            media={media}
            href={href}
          />
        ))}
      </head>
      {/* `antialiased` now comes from the body rule in globals.css. */}
      <body className={`${fraunces.variable} ${nunito.variable}`}>
        {children}
      </body>
    </html>
  );
}
