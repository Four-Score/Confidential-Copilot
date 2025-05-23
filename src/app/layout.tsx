import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from '@/providers/ModalProvider';
import { SearchProvider } from '@/contexts/SearchContext';
import { RemindersCountProvider } from '@/contexts/RemindersCountContext'; // <-- Add this import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Confidential Copilot - CC",
  description: "Secure & Confidential Access to Generative AI",
  icons: {
    icon: '/favicon.ico', // Or your icon's path e.g. '/cc-logo.png'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ModalProvider>
          <SearchProvider>
            <RemindersCountProvider>
              {children}
            </RemindersCountProvider>
          </SearchProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
