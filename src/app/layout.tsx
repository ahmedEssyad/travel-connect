import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { DataProvider } from '@/contexts/DataContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { validateEnvironment } from '@/lib/env-validation';
import dynamic from 'next/dynamic';

// Dynamically import AppLayout to reduce initial bundle size
const AppLayout = dynamic(() => import('@/components/Layout/AppLayout'), {
  ssr: true, // Keep SSR for layout
  loading: () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  )
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Munqidh",
  description: "Emergency blood request matching system - connecting donors with patients in need",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#DC2626",
};

// Initialize environment validation
try {
  validateEnvironment();
} catch (error) {
  console.warn('Environment validation failed during build:', error);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <DataProvider>
                <ToastProvider>
                  <LocationProvider>
                    <AppLayout>
                      {children}
                    </AppLayout>
                  </LocationProvider>
                </ToastProvider>
              </DataProvider>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
