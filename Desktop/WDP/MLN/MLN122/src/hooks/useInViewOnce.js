// src/hooks/useInViewOnce.js
import { useEffect, useRef, useState } from "react";

export default function useInViewOnce(targetRef, options = {}) {
  const {
    root = null,
    threshold = 0.2,
    rootMargin = "0px 0px -8%",
    once = true,
    fallback = true,
  } = options;

  const [inView, setInView] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const el = targetRef?.current;
    if (!el) return;

    if (once && inView) return;

    const hasIO =
      typeof window !== "undefined" &&
      typeof window.IntersectionObserver !== "undefined";

    if (!hasIO) {
      if (fallback) setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) {
            io.disconnect();
            observerRef.current = null;
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { root, threshold, rootMargin }
    );

    observerRef.current = io;
    io.observe(el);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [targetRef, root, threshold, rootMargin, once, inView, fallback]);

  return inView;
}

export function useInView(targetRef, options = {}) {
  return useInViewOnce(targetRef, { ...options, once: false });
}
