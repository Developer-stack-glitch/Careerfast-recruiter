export const getPlaceholderSvg = (text = "Logo", width = 100, height = 100) => {
  const cleanText = text ? String(text).trim() : "Logo";
  const fontSize = Math.max(10, Math.min(width, height, 16));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f1f5f9" rx="6"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}px" font-weight="600">${cleanText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getImageUrl = (url, fallbackText) => {
  if (!url || url === "undefined" || url === "null") {
    return fallbackText ? getPlaceholderSvg(fallbackText) : null;
  }
  
  // Handle Next.js static image imports/Modules which are objects
  if (typeof url === 'object') {
    if (url.default) return getImageUrl(url.default, fallbackText);
    if (url.src) return url.src;
    return url; // fallback for other objects (though this might still cause React errors if rendered)
  }
  
  if (typeof url !== 'string') return url;
  
  // Return if it's already a full URL or a Next.js static media path
  if (
    url.startsWith('http') || 
    url.startsWith('data:') || 
    url.startsWith('/_next/') || 
    url.startsWith('static/') ||
    // Common image extensions and we assume they are local if they don't have http
    (url.startsWith('/') && (url.endsWith('.svg') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp') || url.endsWith('.gif')))
  ) {
    return url;
  }
  
  const baseUrl = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.careerfast.com';
  // If it's just a filename or a path that doesn't look like a local asset, prepend API URL
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};

