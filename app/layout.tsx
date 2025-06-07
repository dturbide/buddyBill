import './globals.css'
import { NotificationProvider } from '@/components/notification-system'
import I18nProvider from '@/components/i18n-provider'
import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'BuddyBill - Partage de Dépenses Multi-Devises',
  description: 'Application de partage de dépenses entre amis avec gestion multi-devises avancée. Idéal pour vos voyages et sorties de groupe.',
  generator: 'Next.js',
  applicationName: 'BuddyBill',
  referrer: 'origin-when-cross-origin',
  keywords: ['partage', 'dépenses', 'voyage', 'groupe', 'amis', 'multi-devises', 'conversion', 'balance'],
  authors: [{ name: 'BuddyBill Team' }],
  creator: 'BuddyBill Team',
  publisher: 'BuddyBill',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://buddybill-expense-sharing.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-CA': '/fr',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: 'https://buddybill-expense-sharing.vercel.app',
    title: 'BuddyBill - Partage de Dépenses Multi-Devises',
    description: 'Simplifiez vos dépenses de groupe avec BuddyBill. Gestion multi-devises, conversion temps réel, partage équitable automatique.',
    siteName: 'BuddyBill',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'BuddyBill App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuddyBill - Partage de Dépenses Multi-Devises',
    description: 'Simplifiez vos dépenses de groupe avec BuddyBill. Gestion multi-devises, conversion temps réel.',
    images: ['/icons/icon-512x512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BuddyBill',
    startupImage: [
      '/icons/icon-192x192.png',
    ],
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ff9f43' },
    { media: '(prefers-color-scheme: dark)', color: '#ff7675' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="shortcut icon" href="/icons/icon-96x96.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#ff9f43" />
        <meta name="theme-color" content="#ff7675" />
      </head>
      <body>
        <I18nProvider locale="en">
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
