export const generateSlug = (text = "") =>
  String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const generatePreviewToken = (jobId) => {
  if (!jobId) return "";
  const secret = "careerfast_admin_preview_token_2026";
  let hash = 0;
  const str = `job_${jobId}_${secret}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16);
  const payload = JSON.stringify({ id: Number(jobId), key: hexPart });
  try {
    if (typeof btoa !== 'undefined') {
      return btoa(payload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    return Buffer.from(payload).toString('base64url');
  } catch (e) {
    return hexPart;
  }
};

export const getJobSlug = (job) => {
  if (!job) return "";
  const safeSlug = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
    } catch (e) { }
    return String(val).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const id = job.id || job.job_id || job.job_post_id;
  const jobNature = safeSlug(job.job_nature || job.type || "job") || "job";
  const jobTitle = safeSlug(job.job_title || job.title || "job");
  const companyName = safeSlug(job.company_name || job.company || "company");
  const locationSlug = safeSlug(job.work_location || job.raw_location || job.location || "");
  const workplaceType = safeSlug(job.workplace_type || job.raw_workplace_type || "");
  const experienceType = safeSlug(job.experience_type || job.level || "");
  const experienceRequired = safeSlug(job.experience_required || job.raw_experience_required || "");

  const parts = [
    jobNature,
    jobTitle,
    companyName,
    locationSlug,
    workplaceType,
    experienceType,
    experienceRequired,
    id
  ];

  return parts.join("-").replace(/-{3,}/g, "--");
};

export const getJobDetailsUrl = (job, preview = false) => {
  if (!job) return "/jobs";
  const slug = getJobSlug(job);
  const id = job.id || job.job_id || job.job_post_id;
  const isPending = job.approval_status === 'pending' || job.approval_status === 'rejected' || preview;

  const baseUrl = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://careerfast.in';

  if (isPending || preview) {
    const token = generatePreviewToken(id);
    return `${baseUrl}/job-details/${slug}?preview=true&preview_token=${token}`;
  }
  return `${baseUrl}/job-details/${slug}`;
};
