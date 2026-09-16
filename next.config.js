const nextConfig = {
  output: 'standalone',
  env: Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((acc, key) => {
      acc[key] = process.env[key];
      return acc;
    }, {}),
  compiler: {
    styledComponents: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', '@ant-design/icons', 'antd'],
  },
  async redirects() {
    return [
      // Redirect old /hr-* paths to root-level pages
      { source: '/hr-jobs', destination: '/overview', permanent: true },
      { source: '/hr-profile', destination: '/profile', permanent: true },
      { source: '/post-jobs', destination: '/post-job', permanent: true },
      { source: '/create-hr-profile', destination: '/create-profile', permanent: true },
      { source: '/hr-recruit', destination: '/recruit', permanent: true },
      { source: '/hr-management', destination: '/management', permanent: true },
      { source: '/pro-subscription', destination: '/billing', permanent: true },
      // Redirect old /recruiter/... bookmarks to root-level pages
      { source: '/recruiter', destination: '/overview', permanent: true },
      { source: '/recruiter/overview', destination: '/overview', permanent: true },
      { source: '/recruiter/my-jobs', destination: '/my-jobs', permanent: true },
      { source: '/recruiter/profile', destination: '/profile', permanent: true },
      { source: '/recruiter/post-job', destination: '/post-job', permanent: true },
      { source: '/recruiter/saved-candidates', destination: '/saved-candidates', permanent: true },
      { source: '/recruiter/create-profile', destination: '/create-profile', permanent: true },
      { source: '/recruiter/recruit', destination: '/recruit', permanent: true },
      { source: '/recruiter/management', destination: '/management', permanent: true },
      { source: '/recruiter/applicants/:id*', destination: '/applicants/:id*', permanent: true },
      { source: '/recruiter/edit-job/:id*', destination: '/edit-job/:id*', permanent: true },
      { source: '/recruiter/all-candidates', destination: '/all-candidates', permanent: true },
      { source: '/recruiter/settings', destination: '/settings', permanent: true },
      { source: '/recruiter/billing', destination: '/billing', permanent: true },
      { source: '/recruiter/post-internship', destination: '/post-internship', permanent: true },
      { source: '/recruiter/post-course', destination: '/post-course', permanent: true },
      // Redirect job & internship details to public frontend
      { source: '/job-details/:path*', destination: 'https://careerfast.in/job-details/:path*', permanent: false },
      { source: '/internship-details/:path*', destination: 'https://careerfast.in/internship-details/:path*', permanent: false },
    ]
  },
};

module.exports = nextConfig;
