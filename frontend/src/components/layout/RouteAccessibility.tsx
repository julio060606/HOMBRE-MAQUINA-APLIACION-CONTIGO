import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Lazy routes are observed so the new page, not the outgoing page, receives focus. */
export function RouteAccessibility() {
  const { pathname } = useLocation();
  useEffect(() => {
    let observer: MutationObserver | undefined;
    const prepare = () => {
      const visible = (element: HTMLElement) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
      const main = [...document.querySelectorAll<HTMLElement>('main')].find(visible);
      if (!main) return;
      main.id = 'main-content';
      main.tabIndex = -1;
      const heading = [...main.querySelectorAll<HTMLElement>('h1')].find(visible);
      if (!heading) return;
      document.title = `${heading.textContent?.trim() || 'Seguimiento'} · CONTIGO`;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      observer?.disconnect();
    };
    const frame = requestAnimationFrame(() => {
      observer = new MutationObserver(prepare);
      observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden'] });
      prepare();
    });
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [pathname]);
  return null;
}
