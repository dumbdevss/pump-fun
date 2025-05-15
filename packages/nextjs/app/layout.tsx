import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '~~/components/ui/toaster'
import ApolloWrapper from '~~/lib/apollo-wrapper'
import { ScaffoldMoveAppWithProviders } from '~~/components/ScaffoldMoveAppWithProviders'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <ScaffoldMoveAppWithProviders>
            <Toaster />
            {children}
          </ScaffoldMoveAppWithProviders>
        </ApolloWrapper>
      </body>
    </html>
  )
}
