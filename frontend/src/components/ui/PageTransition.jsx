import { useLocation } from 'react-router-dom';
import { useRef, useLayoutEffect } from 'react';

/**
 * Wraps child content with a smooth fade-in-up animation
 * every time the route changes. Uses CSS animation + key trick
 * for zero-latency feel (no JS animation libraries needed).
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  // Re-trigger animation on route change
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Force re-trigger by removing and re-adding class
    el.classList.remove('page-transition');
    // Force reflow to ensure the class removal is processed
    void el.offsetHeight;
    el.classList.add('page-transition');
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-transition">
      {children}
    </div>
  );
}
