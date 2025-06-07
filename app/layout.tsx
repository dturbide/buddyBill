import './globals.css'
import { NotificationProvider } from '@/components/notification-system'
import I18nProvider from '@/components/i18n-provider'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BuddyBill',
  description: 'Application de partage de dépenses',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider locale="fr">
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
