import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { UserProvider } from '@/contexts/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Julius - Seu Assistente Financeiro',
  description: 'Gerencie seus limites diários e controle financeiro de forma inteligente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <div className="min-h-screen bg-background">
              <main className="pb-16">
                {children}
              </main>
            </div>
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}