import "../index.css";
import "../App.css";
import "../css/CommonLoader.css";
import { Providers } from "./providers";
import ClientRouteHandler from "./client-route-handler";
import ScrollToTop from "../ScrollTop/ScrollToTop";
import Script from "next/script";
import { Suspense } from "react";
import { Outfit } from "next/font/google";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-YX6Y57X00W";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7f5af0",
};

export const metadata = {
  metadataBase: new URL('https://careerfast.in'),
  title: "CareerFast | Recruiter Portal",
  description: "Connect with top job seekers and manage candidates efficiently with CareerFast Recruiter Portal.",
  robots: "noindex, nofollow",
  openGraph: {
    type: "website",
    siteName: "CareerFast Recruiter Portal",
    images: ["https://careerfast.in/og-image.png"],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://careerfast.in/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${outfit.className}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.transparenttextures.com" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" precedence="default" />
      </head>
      <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <ClientRouteHandler>
              <ScrollToTop />
              {children}
            </ClientRouteHandler>
          </Suspense>
        </Providers>
        {/* GA Script Integration */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
