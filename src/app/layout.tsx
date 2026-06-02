import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, Rajdhani } from 'next/font/google'
import { Header } from '@/components/header'
import './globals.css'

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
})

const rajdhani = Rajdhani({
  variable: '--font-rajdhani',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: "CarpStrike — L'enduro de pêche à la carpe en live",
  description:
    'Organisez et participez aux meilleurs enduros de pêche à la carpe. Classement live, inscriptions en ligne.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${barlow.variable} ${barlowCondensed.variable} ${rajdhani.variable}`}
    >
      <body>
        <div className="bg-atmosphere" />
        <div className="bg-grid" />
        <Header />
        <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      </body>
    </html>
  )
}
