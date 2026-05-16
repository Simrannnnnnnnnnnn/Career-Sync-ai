import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import BottomNav from "@/components/BottomNav"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "CareerSync AI",
  description: "AI-powered career preparation platform",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#09090b]`}>
        <main className="pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}