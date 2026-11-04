import { RefObject, useEffect } from 'react';

/** Keep the native modal inside the visible screen of the mobile preview. */
export function useAppDialogFrame(reference: RefObject<HTMLDialogElement>, open: boolean) {
  useEffect(() => {
    const dialog = reference.current;
    const surface = dialog?.closest<HTMLElement>('[data-app-surface]');
    if (!open || !dialog || !surface) return;
    let frame = 0;
    const update = () => {
      const rect = surface.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft || 0;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportRight = viewportLeft + (viewport?.width || window.innerWidth);
      const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
      const left = Math.max(viewportLeft, rect.left) + 6;
      const top = Math.max(viewportTop, rect.top) + 6;
      const right = Math.min(viewportRight, rect.right) - 6;
      const bottom = Math.min(viewportBottom, rect.bottom) - 6;
      dialog.dataset.dialogInApp = 'true';
      Object.assign(dialog.style, { position: 'fixed', inset: 'auto', margin: '0', left: `${left}px`, top: `${top}px`, width: `${Math.max(0, right - left)}px`, maxWidth: `${Math.max(0, right - left)}px`, maxHeight: `${Math.max(0, bottom - top)}px` });
      dialog.style.setProperty('--app-overlay-top', `${Math.max(0, rect.top)}px`);
      dialog.style.setProperty('--app-overlay-left', `${Math.max(0, rect.left)}px`);
      dialog.style.setProperty('--app-overlay-right', `${Math.max(0, window.innerWidth - rect.right)}px`);
      dialog.style.setProperty('--app-overlay-bottom', `${Math.max(0, window.innerHeight - rect.bottom)}px`);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const containKeyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button, input, textarea, select, summary, a[href], [tabindex]')].filter(element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (first && last && event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus(); }
      else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(surface);
    dialog.addEventListener('keydown', containKeyboard);
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      dialog.removeEventListener('keydown', containKeyboard);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      delete dialog.dataset.dialogInApp;
      for (const property of ['position', 'inset', 'margin', 'left', 'top', 'width', 'max-width', 'max-height', '--app-overlay-top', '--app-overlay-left', '--app-overlay-right', '--app-overlay-bottom']) dialog.style.removeProperty(property);
    };
  }, [reference, open]);
}
