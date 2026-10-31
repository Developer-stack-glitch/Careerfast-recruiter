const baseUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'https://recruit.careerfast.in';

export default async function sitemap() {
  const routes = [
    '',
    '/login',
    '/register',
    '/recruit',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
