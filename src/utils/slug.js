export const generateSlug = (text = "") =>
  String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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
    } catch (e) {}
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
  const isPreviewParam = preview ? "?preview=true" : "";
  return `https://careerfast.in/job-details/${slug}${isPreviewParam}`;
};
