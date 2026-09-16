/**
 * Utility to safely download or view candidate resumes in any format:
 * - Data URLs (e.g. data:application/pdf;base64,...)
 * - Raw Base64 strings
 * - Remote HTTP/HTTPS URLs
 * - Relative server paths (e.g. /uploads/...)
 * 
 * Prevents Apache "414 Request-URI Too Long" errors caused by treating
 * large base64 data strings as relative server paths.
 */

// Helper to convert base64 (with or without data: URI scheme) to a Blob
export const base64ToBlob = (base64Data, defaultMime = 'application/pdf') => {
  if (!base64Data || typeof base64Data !== 'string') return null;

  let mimeType = defaultMime;
  let base64String = base64Data.trim();

  if (base64String.startsWith('data:')) {
    const parts = base64String.split(',');
    const mimeMatch = base64String.match(/^data:([^;]+);/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }
    base64String = parts[1] || '';
  }

  // Remove any potential whitespace or newlines inside base64
  base64String = base64String.replace(/\s/g, '');

  try {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (err) {
    console.error('Error converting base64 to Blob:', err);
    return null;
  }
};

// Check if string is base64 (either data URI or raw base64)
export const isBase64Resume = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'string') return false;
  const str = resumeData.trim();
  if (str.startsWith('data:application/pdf') || str.startsWith('data:application/octet-stream')) {
    return true;
  }
  if (str.startsWith('data:image/')) {
    return true;
  }
  // Check if it's a raw base64 string starting with PDF magic bytes in base64 (JVBERi)
  if (str.startsWith('JVBERi') && str.length > 50) {
    return true;
  }
  return false;
};

// Resolve resume URL if it's a relative path on the server
export const resolveResumeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Downloads candidate resume to local machine cleanly
 */
export const downloadResumeFile = async (resumeData, candidateName = 'Candidate') => {
  if (!resumeData || resumeData === 'Resume' || resumeData === '#' || resumeData === 'null' || resumeData === 'undefined') {
    alert('No resume document attached to this candidate profile.');
    return;
  }

  const cleanName = (candidateName || 'Candidate')
    .trim()
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_');
  const fileName = `${cleanName}_Resume.pdf`;

  // Case 1: Data URI or raw Base64
  if (isBase64Resume(resumeData)) {
    const blob = base64ToBlob(resumeData, 'application/pdf');
    if (blob) {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
      return;
    }
  }

  // Case 2: HTTP / HTTPS / Relative URL
  const targetUrl = resolveResumeUrl(resumeData);
  try {
    const response = await fetch(targetUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
      return;
    }
  } catch (err) {
    console.warn('Direct fetch failed, falling back to direct anchor download:', err);
  }

  // Fallback: standard link click
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = targetUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Views candidate resume in a new tab safely (Blob URL or resolved HTTP URL)
 */
export const viewResumeFile = (resumeData) => {
  if (!resumeData || resumeData === 'Resume' || resumeData === '#' || resumeData === 'null' || resumeData === 'undefined') {
    alert('No resume document attached to this candidate profile.');
    return;
  }

  // Case 1: Base64 / Data URI -> Open Blob URL in a new tab
  if (isBase64Resume(resumeData)) {
    const blob = base64ToBlob(resumeData, 'application/pdf');
    if (blob) {
      const blobUrl = window.URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // If popup blocked, download instead
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'Candidate_Resume.pdf';
        a.click();
      }
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      return;
    }
  }

  // Case 2: HTTP / Relative URL -> Open resolved URL
  const targetUrl = resolveResumeUrl(resumeData);
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
};
