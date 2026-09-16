const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return 'https://api.careerfast.in';
};

const apiBaseUrl = getApiBaseUrl();
const baseUrl = 'https://careerfast.in';

export default async function sitemap() {
  // Static routes
  const routes = [
    '',
    '/about',
    '/jobs',
    '/internships',
    '/scholarships',
    '/blogs',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // Dynamic Job routes
    const jobsRes = await fetch(`${apiBaseUrl}/api/getJobPosts`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) 
    });
    const jobsData = await jobsRes.json();
    const jobs = jobsData?.data?.data || [];
    
    // Dynamic Blog routes
    const blogsRes = await fetch(`${apiBaseUrl}/api/getBlogs`);
    const blogsData = await blogsRes.json();
    const blogs = blogsData?.data || [];

    const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const jobEntries = jobs.map((job) => ({
      url: `${baseUrl}/job-details/${generateSlug(job.job_nature)}-${generateSlug(job.job_title)}-${generateSlug(job.company_name)}-${job.id}`,
      lastModified: new Date(job.created_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const blogEntries = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${generateSlug(blog.blogTitle)}`,
      lastModified: new Date(blog.createdDate),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...routes, ...jobEntries, ...blogEntries];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
