import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SiteLayout } from "@/components/SiteLayout";

export const metadata: Metadata = {
  title: "Senpai Den - Premium Manga Reader",
  description: "Read your favorite manga with zero interruptions and breathtaking design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <Suspense fallback={<div className="min-h-screen bg-[#0F1117]" />}>
          <SiteLayout>
            {children}
          </SiteLayout>
        </Suspense>
      </body>
    </html>
  );
}
