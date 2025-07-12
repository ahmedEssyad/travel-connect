import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { DataProvider } from '@/contexts/DataContext';
import { LocationProvider } from '@/contexts/LocationContext';
import AppLayout from '@/components/Layout/AppLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BloodConnect",
  description: "Emergency blood request matching system - connecting donors with patients in need",
  manifest: "/manifest.json",
  themeColor: "#DC2626",
};

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
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
      </body>
    </html>
  );
}
