import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { AuthProvider } from '@/lib/hooks/AuthProvider';

export const metadata: Metadata = {
  title: 'Code Land Game',
  description: 'Learn HTML, CSS, and JS through epic sports-themed coding challenges!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-[var(--font-body)]" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-72px)]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
