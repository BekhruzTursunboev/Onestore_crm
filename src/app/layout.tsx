import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ShellNavigation from "@/components/ShellNavigation";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "OneStore Gaming CRM",
  description: "OneStore Gaming CS2 skin savdolari uchun ichki CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased selection:bg-white/20 overflow-hidden`}>
        <div className="flex h-[100dvh] w-full flex-col gap-4 bg-[var(--cs-bg)] p-3 md:flex-row md:gap-6 md:p-6">
          <ShellNavigation />

          <main className="doppelrand min-h-0 w-full min-w-0 flex-1">
            <div className="doppelrand-inner overflow-y-auto relative h-full">
              <div className="relative z-10 px-5 py-8 md:px-10 md:py-10 max-w-[1440px] mx-auto h-full animate-in fade-in duration-700 slide-in-from-bottom-4">
                {children}
              </div>

            </div>
          </main>

        </div>
      </body>
    </html>
  );
}
