import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'AI Video Studio - Multi-Mode Video Generation',
  description: 'Create stunning AI-generated videos using Luma Dream Machine, Hugging Face, and advanced cinematic modes. Transform text and images into professional videos.',
  keywords: ['AI video', 'video generation', 'Luma', 'Hugging Face', 'text to video', 'image to video'],
  authors: [{ name: 'AI Video Studio' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    title: 'AI Video Studio - Multi-Mode Video Generation',
    description: 'Create stunning AI-generated videos with multiple generation modes',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
