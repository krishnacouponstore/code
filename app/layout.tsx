import type React from "react"
import type { Metadata } from "next"
import { Outfit, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import "./globals.css"

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", 
  display: "swap",
})

export const metadata: Metadata = {
  title: "CoupX",
  description: "Your trusted platform for buying premium coupon codes at the best prices",
  generator: "@rohanphogatt",
  icons: {
    icon: [
      {
        url: "/images/coupx-icon-dark.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/images/coupx-icon-light.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${outfit.variable} ${inter.variable} font-sans antialiased transition-colors duration-500 ease-in-out`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
