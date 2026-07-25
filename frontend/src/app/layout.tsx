import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

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
    // Default to dark mode strictly for the premium aesthetic
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
