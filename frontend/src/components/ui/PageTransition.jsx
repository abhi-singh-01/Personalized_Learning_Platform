import { useLocation } from 'react-router-dom';
import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

/**
 * GSAP route transition. It also animates existing `.stagger-children`
 * containers so cards enter with a polished but lightweight sequence.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set(el, { autoAlpha: 1, clearProps: 'transform,filter' });
      return undefined;
    }

    const ctx = gsap.context(() => {
      const staggerTargets = gsap.utils.toArray('.stagger-children > *', el);
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      gsap.killTweensOf([el, ...staggerTargets]);

      tl.fromTo(
        el,
        { autoAlpha: 0, y: 18, filter: 'blur(6px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.45,
          clearProps: 'transform,filter,opacity,visibility',
        }
      );

      if (staggerTargets.length) {
        tl.fromTo(
          staggerTargets,
          { autoAlpha: 0, y: 18, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            stagger: 0.055,
            clearProps: 'transform,opacity,visibility',
          },
          '-=0.2'
        );
      }
    }, el);

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div ref={ref} className="gsap-route-transition">
      {children}
    </div>
  );
}
