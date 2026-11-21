import { useEffect, useState } from 'react';

// True only for phone/tablet-sized viewports, matching the CSS media query.
// Used to trim decorative work on mobile; desktop (769px+) stays untouched.
const QUERY = '(max-width: 768px)';

function isMobileDevice() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(QUERY).matches
  );
}

export function useMobileDevice() {
  const [mobile, setMobile] = useState(isMobileDevice);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return mobile;
}
