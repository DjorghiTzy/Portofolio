/* ============================================================
   Smooth scrolling.

   The window keeps scrolling natively — the document still has its real
   height, so the scrollbar, keyboard, Find-in-page, anchor links and
   focus-follows-Tab all behave normally. All this does is translate the
   content toward the true scroll offset a few frames behind, which is
   what reads as "smooth".

   Deliberately not Lenis: the whole behaviour is the twelve lines of
   lerp in tick(), and hijacking wheel events (what most libraries do)
   is what breaks trackpad feel and accessibility.
   ============================================================ */
window.SmoothScroll = (function () {
  'use strict';

  function create({ wrapper, content, ease = 0.16, maxJumpScreens = 1.4 }) {
    if (!wrapper || !content) return null;

    let target = window.scrollY;
    let current = target;
    let raf = null;
    let last = performance.now();
    let enabled = false;
    let resizeObserver = null;

    /* The wrapper is taken out of flow, so the document needs its height
       restated or there would be nothing left to scroll. */
    function syncHeight() {
      document.body.style.height = content.offsetHeight + 'px';
    }

    function render() {
      content.style.transform = `translate3d(0, ${-current.toFixed(2)}px, 0)`;
    }

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      target = window.scrollY;

      /* Frame-rate independent lerp: the same feel at 60Hz and 144Hz. */
      const k = 1 - Math.pow(1 - ease, dt * 60);
      current += (target - current) * k;

      if (Math.abs(target - current) < 0.2) {
        current = target;
        render();
        raf = null;           // settled — stop burning frames
        return;
      }
      render();
      raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      document.documentElement.classList.add('smooth-on');
      syncHeight();
      current = target = window.scrollY;
      render();

      window.addEventListener('scroll', wake, { passive: true });
      window.addEventListener('resize', syncHeight);
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(syncHeight);
        resizeObserver.observe(content);
      }
      wake();
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      document.documentElement.classList.remove('smooth-on');
      document.body.style.height = '';
      content.style.transform = '';
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', syncHeight);
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    /* Jump the native scroll and let the lerp animate the travel — this is
       why in-page links must not also use CSS smooth scrolling, or the two
       easings fight each other.

       An exponential lerp has a long tail, so a full-page jump (back-to-top
       from the footer, say) would take nearly two seconds to settle. Closing
       the gap to a couple of screens first keeps navigation snappy while
       still arriving with the same easing. */
    function scrollTo(y) {
      const max = Math.max(0, document.body.offsetHeight - window.innerHeight);
      const dest = Math.max(0, Math.min(y, max));
      const limit = window.innerHeight * maxJumpScreens;
      if (Math.abs(dest - current) > limit) {
        current = dest + Math.sign(dest - current) * -limit;
        render();
      }
      window.scrollTo({ top: dest, behavior: 'auto' });
      wake();
    }

    return {
      enable,
      disable,
      scrollTo,
      syncHeight,
      get offset() { return current; },
      get isEnabled() { return enabled; }
    };
  }

  return { create };
})();
