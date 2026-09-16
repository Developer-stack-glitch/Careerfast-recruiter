'use client';
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogUrl,
  ogTitle,
  ogDescription,
  ogImage,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData = [], // Array of schema objects
  organizationSchema = true,
  breadcrumbSchema = null, // Array of { name, item }
}) => {
  const siteName = 'CareerFast';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const currentUrl = ogUrl || window.location.href;

  // Utility to strip HTML tags for meta content
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  const cleanDescription = stripHtml(description).substring(0, 200);
  const defaultDescription = 'Discover premium job opportunities and internships with top-tier companies. CareerFast connects job seekers with verified recruiters.';
  const siteLogo = 'https://careerfast.in/og-image.png'; // Update with actual logo URL

  const organizationJSON = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CareerFast",
    "url": "https://careerfast.in",
    "logo": siteLogo,
    "description": "CareerFast is a premier jobs platform connecting job seekers with top companies for jobs, internships, and career opportunities.",
    "sameAs": [
      "https://www.facebook.com/careerfast",
      "https://www.twitter.com/careerfast",
      "https://www.linkedin.com/company/careerfast"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@careerfast.in"
    }
  };

  const breadcrumbJSON = breadcrumbSchema ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbSchema.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('http') ? item.item : `https://careerfast.in${item.item}`
    }))
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={cleanDescription || defaultDescription} />
      {keywords && <meta name="keywords" content={stripHtml(keywords)} />}
      <link rel="canonical" href={canonical || currentUrl} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={stripHtml(ogTitle || fullTitle)} />
      <meta property="og:description" content={stripHtml(ogDescription) || cleanDescription || defaultDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={stripHtml(twitterTitle || ogTitle || fullTitle)} />
      <meta name="twitter:description" content={stripHtml(twitterDescription) || stripHtml(ogDescription) || cleanDescription || defaultDescription} />
      {twitterImage || ogImage ? (
        <meta name="twitter:image" content={twitterImage || ogImage} />
      ) : null}

      {/* Structured Data */}
      {organizationSchema && (
        <script type="application/ld+json">{JSON.stringify(organizationJSON)}</script>
      )}
      {breadcrumbJSON && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJSON)}</script>
      )}
      {structuredData.map((data, index) => (
        <script key={`structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;

