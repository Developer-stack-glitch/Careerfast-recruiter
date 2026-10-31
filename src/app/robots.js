const baseUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'https://recruit.careerfast.in';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/recruit'],
      disallow: [
        '/overview',
        '/all-candidates',
        '/applicants',
        '/applicants/*',
        '/candidate-search',
        '/candidate-search/*',
        '/my-jobs',
        '/post-job',
        '/post-internship',
        '/post-course',
        '/edit-job',
        '/edit-job/*',
        '/saved-candidates',
        '/folders',
        '/manage-folder',
        '/reports',
        '/team',
        '/settings',
        '/billing',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
