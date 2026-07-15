"use client";

import { useEffect } from "react";

export function ScrollToTop({ slug }: { slug: string }) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [slug]);

  return null;
}
