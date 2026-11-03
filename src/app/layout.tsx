import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "ROVEO — Your journey, your way",
  description:
    "Discover extraordinary destinations, create personalized travel itineraries with AI, or manually craft and customize your dream trips. Beautiful, intelligent, and seamless travel planning.",
  keywords: [
    "travel planner",
    "AI trip planner",
    "itinerary generator",
    "vacation planning",
    "ROVEO",
    "luxury travel",
    "travel guide",
  ],
  authors: [{ name: "ROVEO Travel Tech" }],
  openGraph: {
    title: "ROVEO — Your journey, your way",
    description:
      "Intelligent, bespoke travel planning powered by AI. Explore, plan, and travel on your terms.",
    type: "website",
    siteName: "ROVEO",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#172B3A" },
  ],
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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col selection:bg-[#64B5A7]/30 selection:text-[#172B3A] dark:selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
