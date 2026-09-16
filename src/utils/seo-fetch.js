
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return 'https://api.careerfast.in'; // Production fallback
};

const apiBaseUrl = getApiBaseUrl();

export const fetchJobForSEO = async (jobId) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/getJobPosts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId }),
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const result = await response.json();
    const jobData = result?.data?.data;
    if (Array.isArray(jobData) && jobData.length > 0) {
      return jobData[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching job for SEO:', error);
    return null;
  }
};

export const fetchBlogForSEO = async (blogId) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/getBlogById/${blogId}`, {
      next: { revalidate: 3600 }
    });
    const result = await response.json();
    return result?.data || null;
  } catch (error) {
    console.error('Error fetching blog for SEO:', error);
    return null;
  }
};
