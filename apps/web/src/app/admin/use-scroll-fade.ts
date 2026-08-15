import { useEffect, useRef, useState, type DependencyList } from "react";

// Tracks whether an overflow-x-auto row still has more to scroll to, so a
// fade hint can be shown — its own scrollbar is hidden via .no-scrollbar,
// so without this the cut-off content has no visual cue that it scrolls.
// Pass deps when the scroll container is conditionally rendered (e.g. only
// once data finishes loading), so the effect re-attaches once it mounts.
export function useScrollFade<T extends HTMLElement>(deps: DependencyList = []) {
  const ref = useRef<T>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [ref, canScrollRight] as const;
}
