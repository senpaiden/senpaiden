import type { Metadata } from "next";
import "./globals.css";
import { SiteLayout } from "@/components/SiteLayout";
import { CookieConsent } from "@/components/CookieConsent";
import { MonetizationProvider } from "@/components/MonetizationProvider";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Read Manga, Manhwa & Webtoons Online | Senpai Den",
    template: "%s | Senpai Den",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: "Read Manga, Manhwa & Webtoons Online | Senpai Den",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: absoluteUrl("/icon.png"), alt: "Senpai Den" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Read Manga, Manhwa & Webtoons Online | Senpai Den",
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl("/icon.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, description: DEFAULT_DESCRIPTION, inLanguage: "en" },
      { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: `${SITE_URL}/`, logo: absoluteUrl("/icon.png") },
    ],
  };
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <SiteLayout>
          {children}
        </SiteLayout>
        <CookieConsent />
        <MonetizationProvider />
      </body>
    </html>
  );
}
