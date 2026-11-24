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

export const formatExperienceDisplay = (expList, experienceType, jobContext = null) => {
  let job = jobContext;
  let raw = expList;
  let expType = experienceType;

  // Support calling with single job object: formatExperienceDisplay(job)
  if (expList && typeof expList === 'object' && !Array.isArray(expList) && (expList.job_title || expList.title || expList.experience_required !== undefined)) {
    job = expList;
    raw = job.experience_required || job.raw_experience_required;
    expType = job.experience_type || job.level;
  }

  if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
    try {
      raw = JSON.parse(raw);
    } catch (_) {}
  }

  let text = "";
  if (Array.isArray(raw)) {
    // If array of graduation years e.g. ["2024", "2025", "2026"] -> Fresher
    const isGradYears = raw.length > 0 && raw.every(x => /^\s*20\d\d\s*$/.test(String(x)));
    if (isGradYears) {
      return "Fresher";
    }
    const cleaned = raw.filter(x => x !== null && x !== undefined && String(x).trim() !== "" && String(x).trim().toLowerCase() !== "all");
    if (cleaned.length > 0) {
      text = cleaned.join(", ");
    }
  } else if (raw && String(raw).trim() !== "" && String(raw).trim().toLowerCase() !== "all") {
    text = String(raw).trim();
  }

  const cleanText = text.replace(/^[\[\]"'\s]+|[\[\]"'\s]+$/g, '').trim();
  const expTypeLower = String(expType || "").trim().toLowerCase();

  // If already "Fresher"
  if (/^fresher$/i.test(cleanText) || expTypeLower === "fresher" && (!cleanText || /^(?:all|fresher)$/i.test(cleanText))) {
    return "Fresher";
  }

  // Check for 0-0 or 0 - 0 (e.g. "0-0 Years", "0 - 0 Years", "0-0", "0 - 0", "0-0 yrs", "0 to 0")
  if (/^0\s*[-–—to]\s*0(\s*(?:yrs|years?))?$/i.test(cleanText)) {
    return "Fresher";
  }

  // Check for single "0", "0 Years", "0 Year", "0 yrs"
  if (/^0\s*(?:yrs|years?)?$/i.test(cleanText)) {
    return "Fresher";
  }

  // Check for identical range like "2-2 Years" or "2-2" -> "2 Years"
  const sameRangeMatch = cleanText.match(/^(\d+)\s*[-–—to]\s*\1\s*(?:yrs|years?)?$/i);
  if (sameRangeMatch) {
    const n = Number(sameRangeMatch[1]);
    if (n === 0) return "Fresher";
    return `${n} Year${n !== 1 ? 's' : ''}`;
  }

  // Check for standard numeric range e.g. "0-2", "0 to 2", "1-3", "2 - 5", "0-5 Years"
  const rangeMatch = cleanText.match(/^(\d+)\s*[-–—to]\s*(\d+)\s*(?:yrs|years?)?$/i);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (min === 0 && max === 0) return "Fresher";
    if (min === max) return `${min} Year${min !== 1 ? 's' : ''}`;
    return `${min}-${max} Years`;
  }

  // Check for single number e.g. "2" -> "2 Years", "1" -> "1 Year"
  const singleMatch = cleanText.match(/^(\d+)\s*(?:yrs|years?)?$/i);
  if (singleMatch) {
    const n = Number(singleMatch[1]);
    if (n === 0) return "Fresher";
    return `${n} Year${n !== 1 ? 's' : ''}`;
  }

  // Check for plus pattern e.g. "2+" -> "2+ Years"
  const plusMatch = cleanText.match(/^(\d+)\s*\+\s*(?:yrs|years?)?$/i);
  if (plusMatch) {
    return `${plusMatch[1]}+ Years`;
  }

  // If cleanText is a descriptive experience string already containing Years
  if (cleanText && !/^experience[d]?$/i.test(cleanText) && !/^null$/i.test(cleanText) && /(?:years?|yrs)/i.test(cleanText)) {
    return cleanText;
  }

  // Fallback 1: Extract from apply_link if available
  const applyLink = job?.apply_link || (typeof expList === 'object' ? expList?.apply_link : null);
  if (applyLink) {
    const linkRange = applyLink.match(/(\d+)[-\s]*(?:to|–|-)[-\s]*(\d+)[-\s]*(?:years?|yrs?)/i);
    if (linkRange) {
      const min = Number(linkRange[1]);
      const max = Number(linkRange[2]);
      if (min === 0 && max === 0) return "Fresher";
      if (min === max) return `${min} Year${min !== 1 ? 's' : ''}`;
      return `${min}-${max} Years`;
    }
    const singleLink = applyLink.match(/(\d+)\+?[-\s]*(?:years?|yrs?)/i);
    if (singleLink) {
      const n = Number(singleLink[1]);
      if (n === 0) return "Fresher";
      return `${n}+ Years`;
    }
  }

  // Fallback 2: Extract from job_description if available
  const desc = job?.job_description || job?.description || "";
  if (desc) {
    const plain = desc.replace(/<[^>]+>/g, ' ');
    const descRange = plain.match(/(\d+)\s*(?:to|-|–|—)\s*(\d+)\s*(?:years?|yrs?)(?:\s*of\s*experience)?/i);
    if (descRange) {
      const min = Number(descRange[1]);
      const max = Number(descRange[2]);
      if (min === 0 && max === 0) return "Fresher";
      if (min === max) return `${min} Year${min !== 1 ? 's' : ''}`;
      return `${min}-${max} Years`;
    }
    const descSingle = plain.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?(?:work\s*)?experience/i);
    if (descSingle) {
      const n = Number(descSingle[1]);
      if (n === 0) return "Fresher";
      return `${n}+ Years`;
    }
    if (/more\s*than\s*(?:a|one)\s*year/i.test(plain)) {
      return "1+ Years";
    }
  }

  // If cleanText is non-empty and not just "Experienced", return it
  if (cleanText && !/^experience[d]?$/i.test(cleanText) && !/^null$/i.test(cleanText)) {
    return cleanText;
  }

  // Fallback 3: If marked as Experienced or empty, default to "1-3 Years" instead of bare "Experienced"
  return "1-3 Years";
};
