/**
 * Authentic Educator Avatar & Media System.
 * - Displays authentic teacher uploaded photos (e.g. Cloudinary, Google profile photo).
 * - For teachers without uploaded photos, renders an authentic brand monogram avatar
 *   (EduVista brand-moss background #1C2B22 with crisp initials and terracotta ring).
 * - Completely prevents placeholder/stock photography (Unsplash models, Mixkit stock clips)
 *   to ensure absolute trustworthiness and transparency for parents.
 */

const REJECTED_PATTERNS = [
  'unsplash.com',
  'images.unsplash.com',
  'ui-avatars.com',
  'placeholder',
  'avatar-default',
  'v1792159',
  'ekb2uxzepcz2cyl79d99',
  'gr8kdtbut0mm0oyr87uh',
  'ywftcvfkiypy6nwlzuyl',
  'uhh3vabvc08i1ukgefdz',
  's8x3upcakgfaksbhnv38',
  'fmyjjovymarmn7almbg5',
  'aaqlqy5vbyaaectrkwe5',
  'v33k30ec1dykr8fvstwc',
  'evn2aha8ohnhzl1yllih',
  'leuhhovqy481gj7gnq9n',
  't7osrcncmeweybsguwqz',
  'lbjqorktmrzghfwlfdpp',
  'yfk97qh8g7ekbaaif9od'
];

/**
 * Returns initials from an educator's full name.
 * e.g. "Adenike Enoch-Salami" -> "AE", "Christian Nwode" -> "CN"
 */
export function getInitials(name = 'Tutor') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ED';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates an SVG Data URI monogram in EduVista brand colors.
 */
export function getTeacherMonogram(name = 'Tutor') {
  const initials = getInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="60" fill="#1C2B22"/>
    <circle cx="60" cy="60" r="56" fill="none" stroke="#C85A32" stroke-width="2.5" opacity="0.4"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#FBF8F3" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="700" font-size="42" letter-spacing="1">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Checks whether an avatar string is a real, authentic uploaded photo.
 */
export function isRealTeacherAvatar(avatar) {
  if (!avatar || typeof avatar !== 'string') return false;
  const clean = avatar.trim().toLowerCase();
  if (!clean) return false;
  for (const pattern of REJECTED_PATTERNS) {
    if (clean.includes(pattern.toLowerCase())) return false;
  }
  return true;
}

/**
 * Gets display avatar for a teacher:
 * Real uploaded picture if authentic, or clean brand monogram initials otherwise.
 */
export function getTeacherAvatar(avatar, name = 'Tutor') {
  if (isRealTeacherAvatar(avatar)) {
    return avatar.trim();
  }
  return getTeacherMonogram(name);
}

/**
 * Checks if a video introduction URL is genuine and not a demo/stock placeholder.
 */
export function isRealTeacherVideo(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') return false;
  const clean = videoUrl.trim().toLowerCase();
  if (!clean) return false;
  if (clean.includes('mixkit.co')) return false;
  if (clean.includes('cloudinary.com/demo')) return false;
  if (clean.includes('elephants.mp4') || clean.includes('dog.mp4')) return false;
  return true;
}

/**
 * Image onError handler to cleanly fallback to brand monogram.
 */
export const handleAvatarError = (name = 'Tutor') => (e) => {
  if (e && e.currentTarget) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = getTeacherMonogram(name);
  }
};
