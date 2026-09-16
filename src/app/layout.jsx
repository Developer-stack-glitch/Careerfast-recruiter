import "../index.css";
import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Header.css";
import "../css/LandingPage.css";
import "../css/LoginPage.css";
import "../css/Footer.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Providers } from "./providers";
import ClientRouteHandler from "./client-route-handler";
import ScrollToTop from "../ScrollTop/ScrollToTop";
import Script from "next/script";
import { Suspense } from "react";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7f5af0",
};

export const metadata = {
  metadataBase: new URL('https://careerfast.in'),
  title: "CareerFast",
  description: "Discover premium job opportunities and internships with top-tier companies. CareerFast connects job seekers with verified recruiters.",
  robots: "index, follow",
  openGraph: {
    type: "website",
    siteName: "CareerFast",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.transparenttextures.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" precedence="default" />

      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <ClientRouteHandler>
              <ScrollToTop />
              {children}
            </ClientRouteHandler>
          </Suspense>
        </Providers>
        {/* GA Script Integration */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-YX6Y57X00W" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-YX6Y57X00W');
          `}
        </Script>
        {/* Google Maps Integration */}
        <Script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA2-QH2Uf2Jq9AyVfotBjQfgS9-VkPTLQ4&libraries=places&loading=async"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}


