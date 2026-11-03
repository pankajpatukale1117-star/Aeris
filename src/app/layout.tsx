import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "ROVEO — Your Journey, Your Way | AI Travel Concierge & Interactive Atlas",
  description:
    "Luxury AI Travel Concierge & Interactive Atlas. Discover extraordinary sanctuaries, synthesize bespoke multi-day itineraries with intelligence, or craft custom routes with total autonomy.",
  keywords: [
    "ROVEO",
    "AI travel concierge",
    "luxury travel",
    "interactive atlas",
    "trip architect",
    "bespoke itineraries",
    "liquid glassmorphism",
  ],
  authors: [{ name: "ROVEO Travel Architecture" }],
  openGraph: {
    title: "ROVEO — Your Journey, Your Way",
    description:
      "Luxury AI Travel Concierge & Interactive Atlas with Liquid Glassmorphism UI.",
    type: "website",
    siteName: "ROVEO",
  },
}

export const viewport: Viewport = {
  themeColor: "#050a10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Leaflet CSS loaded via CDN to avoid PostCSS subprocess bottlenecks */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        {/* Tailwind CDN as guaranteed fallback anti-breakage safeguard */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      background: '#050a10',
                      foreground: '#f1f5f9',
                      champagne: {
                        300: '#f3e8d2',
                        400: '#e8d5b5',
                        500: '#d4b483',
                      },
                      cyanLuxe: '#38bdf8',
                    },
                    fontFamily: {
                      editorial: ['"Cormorant Garamond"', 'Georgia', 'serif'],
                      sans: ['"Inter"', 'system-ui', 'sans-serif'],
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[#050a10] text-[#f1f5f9] min-h-screen flex flex-col selection:bg-[#e8d5b5]/30 selection:text-white relative overflow-x-hidden">
        {/* Ambient Blurred Aurora Orbs */}
        <div className="aurora-orb aurora-cyan w-[30rem] h-[30rem] -top-24 -left-24 fixed pointer-events-none" />
        <div className="aurora-orb aurora-champagne w-[30rem] h-[30rem] top-1/2 -right-24 fixed pointer-events-none" />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
