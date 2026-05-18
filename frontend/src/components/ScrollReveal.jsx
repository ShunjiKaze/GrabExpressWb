import { useEffect, useRef } from 'react';

function ScrollReveal({ children, delay = 0, direction = 'up', style = {}, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          observer.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: '0px 0px 60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const initial = {
    up:    'translateY(20px)',
    left:  'translateX(-20px)',
    right: 'translateX(20px)',
    zoom:  'scale(0.96)',
  }[direction] || 'translateY(20px)';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: initial,
        transition: `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default ScrollReveal;
