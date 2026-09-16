export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin-dashboard', '/candidate-profile', '/all-candidates'],
    },
    sitemap: 'https://careerfast.in/sitemap.xml',
  };
}
