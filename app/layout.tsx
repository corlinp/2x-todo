import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const defaultUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "2xTODO - Double Your Productivity",
  description: "A minimalist, real-time, AI-assisted to-do board. Swipe, drag, and get things done.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
