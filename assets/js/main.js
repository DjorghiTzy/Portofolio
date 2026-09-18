/* ============================================================
   Djorghi Andima — portfolio behaviour.
   Plain ES2020, no framework, no build step. Everything here is
   progressive enhancement: the page is readable and navigable with
   this file removed entirely.
   ============================================================ */
(function () {
  'use strict';

  const D = window.PORTFOLIO;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const EMAIL = 'djorghiandima@gmail.com';
  const WA    = '6285717254391';

  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v === null ? fallback : v; }
      catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    del(k)    { try { localStorage.removeItem(k); } catch { /* private mode */ } }
  };

  let lang = store.get('lang', (navigator.language || 'en').toLowerCase().startsWith('id') ? 'id' : 'en');
  const t = (obj) => (obj && typeof obj === 'object' ? (obj[lang] ?? obj.en) : obj);
  const svg = (name, cls = 'ico') => `<svg viewBox="0 0 24 24" class="${cls}">${D.ICONS[name] || ''}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ========================================================
     TOASTS
     ======================================================== */
  const toastHost = $('#toasts');
  function toast(msg, kind = 'ok') {
    if (!toastHost) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.dataset.kind = kind;
    el.innerHTML = `${svg(kind === 'error' ? 'target' : 'spark')}<span>${esc(msg)}</span>`;
    toastHost.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 2600);
  }

  /* ========================================================
     PRELOADER
     ======================================================== */
  (function preloader() {
    const el = $('#preloader');
    const fill = $('#preloaderFill');
    const pct = $('#preloaderPct');
    if (!el) return;

    let value = 0;
    const tick = setInterval(() => {
      /* Creep toward 90% while assets load; the load event finishes it. */
      value = Math.min(90, value + Math.random() * 18);
      if (fill) fill.style.width = value + '%';
      if (pct) pct.textContent = Math.round(value);
    }, 130);

    function finish() {
      clearInterval(tick);
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100';
      setTimeout(() => {
        el.classList.add('is-done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
      }, 260);
    }

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    /* Never strand the page behind a hung asset. */
    setTimeout(finish, 4500);
  })();

  /* ========================================================
     THEME / ACCENT / LANGUAGE
     ======================================================== */
  const root = document.documentElement;
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)');

  function applyTheme(theme, announce) {
    root.dataset.theme = theme;
    store.set('theme', theme);
    const meta = theme === 'light' ? '#f4f7f5' : '#07100d';
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', meta));
    if (window.heroScene) window.heroScene.refreshAccent();
    if (window.scrollScene) window.scrollScene.applyTheme();
    if (announce) toast(theme === 'light' ? t(D.ui.themeLight) : t(D.ui.themeDark));
  }

  function applyAccent(accent, announce) {
    root.dataset.accent = accent;
    store.set('accent', accent);
    if (window.heroScene) window.heroScene.refreshAccent();
    if (window.scrollScene) window.scrollScene.applyTheme();
    if (announce) toast(t(D.ui.accentSet));
  }

  applyTheme(store.get('theme', prefersLight.matches ? 'light' : 'dark'), false);
  applyAccent(store.get('accent', 'emerald'), false);

  prefersLight.addEventListener('change', (e) => {
    /* Only follow the OS once the visitor has not chosen for themselves. */
    if (!store.get('theme', null)) applyTheme(e.matches ? 'light' : 'dark', false);
  });

  function toggleTheme() {
    applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
  }

  /* ---- i18n over the static markup ---- */
  function applyLang(next, announce) {
    lang = next;
    store.set('lang', lang);
    root.lang = lang === 'id' ? 'id' : 'en';

    $$('[data-i18n]').forEach((el) => {
      if (!('en' in el.dataset)) {
        el.dataset.en = el.hasAttribute('data-html') ? el.innerHTML.trim() : el.textContent.trim();
      }
      const value = lang === 'id' ? el.dataset.id : el.dataset.en;
      if (value == null) return;
      if (el.hasAttribute('data-html')) el.innerHTML = value;
      else el.textContent = value;
    });

    const label = $('#langLabel');
    if (label) label.textContent = lang === 'id' ? 'ID' : 'EN';

    renderAll();
    buildPaletteItems();
    updateStatus();
    typewriter.reset();
    if (announce) toast(t(D.ui.langSet));
  }

  function toggleLang() { applyLang(lang === 'id' ? 'en' : 'id', true); }

  /* ========================================================
     SMOOTH SCROLL
     Native window scroll stays authoritative; the wrapper is translated
     toward it a few frames behind. Left off for touch (the OS already
     does momentum, and fighting it feels worse) and for reduced motion.
     ======================================================== */
  const smooth = (!isTouch && !reduced && window.SmoothScroll)
    ? window.SmoothScroll.create({
        wrapper: $('#smoothWrapper'),
        content: $('#smoothContent')
      })
    : null;

  /* Document-space offset of an element. offsetTop is layout-based, so it is
     unaffected by the smooth-scroll transform — reading getBoundingClientRect
     here would chase the lerp and never settle. */
  function documentTop(el) {
    let y = 0;
    for (let node = el; node && node !== document.body; node = node.offsetParent) {
      y += node.offsetTop;
    }
    return y;
  }

  const NAV_CLEARANCE = 88;

  function goTo(target) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    const y = Math.max(0, documentTop(el) - NAV_CLEARANCE);
    if (smooth && smooth.isEnabled) smooth.scrollTo(y);
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  function goToTop() {
    if (smooth && smooth.isEnabled) smooth.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ========================================================
     RENDERERS
     ======================================================== */
  function renderSkills() {
    const host = $('#skillsGrid');
    if (!host) return;
    host.innerHTML = D.skills.map((s, i) => `
      <article class="skill" data-cat="${s.cat}" data-i="${i}">
        <div class="skill__top">
          <span class="skill__ico">${svg(s.icon)}</span>
          <span class="skill__name">${esc(t(s.name))}</span>
          <span class="skill__lvl">${s.lvl}%</span>
        </div>
        <p class="skill__note">${esc(t(s.note))}</p>
        <div class="skill__bar"><i data-lvl="${s.lvl}"></i></div>
      </article>`).join('');

    /* Light follows the pointer inside each card. */
    $$('.skill', host).forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--lx', `${e.clientX - r.left}px`);
        card.style.setProperty('--ly', `${e.clientY - r.top}px`);
      });
    });

    observeBars();
  }

  function observeBars() {
    const bars = $$('.skill__bar i');
    if (!('IntersectionObserver' in window)) {
      bars.forEach((b) => { b.style.width = b.dataset.lvl + '%'; });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        setTimeout(() => { el.style.width = el.dataset.lvl + '%'; }, 80);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    bars.forEach((b) => io.observe(b));
  }

  function renderMarquee() {
    const host = $('#marqueeTrack');
    if (!host) return;
    const words = D.marquee[lang] || D.marquee.en;
    /* Two copies so the -50% keyframe loops seamlessly. */
    host.innerHTML = [...words, ...words].map((wd) => `<span>${esc(wd)}</span>`).join('');
  }

  function renderTimeline() {
    const host = $('#timeline');
    if (!host) return;
    host.innerHTML = D.experience.map((job, i) => `
      <li class="tl${i === 0 ? ' is-open' : ''}">
        <button class="tl__head" aria-expanded="${i === 0}" aria-controls="tlp${i}">
          <span class="tl__year">${esc(job.year)}</span>
          <span class="tl__role">${esc(t(job.role))}
            <svg viewBox="0 0 24 24" class="ico"><path d="m6 9 6 6 6-6"/></svg>
          </span>
          <span class="tl__co">${esc(job.company)}</span>
        </button>
        <div class="tl__panel" id="tlp${i}" role="region">
          <div><div class="tl__inner">
            <p>${esc(t(job.summary))}</p>
            <ul class="tl__points">${t(job.points).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
            <div class="tl__tags">${job.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
          </div></div>
        </div>
      </li>`).join('');

    $$('.tl__head', host).forEach((btn) => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.tl');
        const open = li.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function renderCerts() {
    const host = $('#certsGrid');
    if (!host) return;
    host.innerHTML = D.certificates.map((c, i) => `
      <button class="cert reveal" data-cert="${i}">
        <span class="cert__ico">${svg(c.icon)}</span>
        <h3>${esc(t(c.title))}</h3>
        <p class="cert__issuer">${esc(c.issuer)}</p>
        <p class="cert__date">${esc(t(c.date))}</p>
        <span class="cert__more">${esc(t(D.ui.viewCert))}
          <svg viewBox="0 0 24 24" class="ico"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </button>`).join('');

    $$('.cert', host).forEach((el) => {
      el.addEventListener('click', () => openDetail('cert', Number(el.dataset.cert)));
    });
  }

  function renderProjects() {
    const host = $('#projectsGrid');
    if (!host) return;
    host.innerHTML = D.projects.map((p, i) => `
      <button class="project reveal" data-project="${i}" data-cat="${p.cat}">
        <span class="project__art">
          <span class="project__badge">${esc(t(p.badge))}</span>
          ${svg(p.icon)}
        </span>
        <span class="project__body">
          <h3>${esc(t(p.title))}</h3>
          <p>${esc(t(p.blurb))}</p>
          <span class="project__tags">${p.tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</span>
          <span class="project__cta">${esc(t(D.ui.caseStudy))}
            <svg viewBox="0 0 24 24" class="ico"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </span>
      </button>`).join('');

    $$('.project', host).forEach((el) => {
      el.addEventListener('click', () => openDetail('project', Number(el.dataset.project)));
    });
  }

  function renderAll() {
    renderSkills();
    renderMarquee();
    renderTimeline();
    renderCerts();
    renderProjects();
    applyFilters();
    initReveal();
    initTilt();
  }

  /* ========================================================
     FILTERS (skills + projects)
     ======================================================== */
  let skillFilter = 'all';
  let projectFilter = 'all';

  function applyFilters() {
    $$('.skill').forEach((el) => {
      el.classList.toggle('is-hidden', skillFilter !== 'all' && el.dataset.cat !== skillFilter);
    });
    $$('.project').forEach((el) => {
      el.classList.toggle('is-hidden', projectFilter !== 'all' && el.dataset.cat !== projectFilter);
    });
  }

  function wireFilterGroup(attr, setter) {
    const buttons = $$(`[${attr}]`);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
        setter(btn.getAttribute(attr));
        applyFilters();
      });
    });
  }
  wireFilterGroup('data-filter',  (v) => { skillFilter = v; });
  wireFilterGroup('data-pfilter', (v) => { projectFilter = v; });

  /* ========================================================
     DETAIL MODAL (certificates + projects share one dialog)
     ======================================================== */
  const detail = {
    el: $('#detail'),
    kind: 'cert',
    index: 0
  };

  function detailSet() { return detail.kind === 'cert' ? D.certificates : D.projects; }

  function paintDetail() {
    const items = detailSet();
    const item = items[detail.index];
    if (!item) return;

    $('#detailIndex').textContent = `${detail.index + 1} / ${items.length}`;
    $('#detailIco').innerHTML = svg(item.icon);
    $('#detailTitle').textContent = t(item.title);

    if (detail.kind === 'cert') {
      $('#detailSub').textContent = `${item.issuer} · ${t(item.date)}`;
      $('#detailBody').innerHTML = `<p>${esc(t(item.body))}</p>`;
      $('#detailMeta').innerHTML = t(item.meta)
        .map(([k, v]) => `<div><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('');
      $('#detailLinks').innerHTML = '';
    } else {
      $('#detailSub').textContent = t(item.badge);
      $('#detailBody').innerHTML =
        `<p>${esc(t(item.body))}</p><ul>${t(item.highlights).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      $('#detailMeta').innerHTML =
        `<div><span class="k">Stack</span><span class="v">${item.tags.map(esc).join(' · ')}</span></div>`;
      $('#detailLinks').innerHTML = (item.links || [])
        .map((l) => `<a class="btn btn--sm" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}
          <svg viewBox="0 0 24 24" class="ico"><path d="M7 17 17 7M9 7h8v8"/></svg></a>`).join('');
    }
  }

  function openDetail(kind, index) {
    detail.kind = kind;
    detail.index = index;
    paintDetail();
    overlay.open(detail.el);
  }

  function stepDetail(delta) {
    const items = detailSet();
    detail.index = (detail.index + delta + items.length) % items.length;
    paintDetail();
  }

  $('#detailPrev')?.addEventListener('click', () => stepDetail(-1));
  $('#detailNext')?.addEventListener('click', () => stepDetail(1));

  /* ========================================================
     OVERLAY MANAGER — one Esc/backdrop/focus-trap implementation
     shared by the palette, the shortcut sheet and the detail modal.
     ======================================================== */
  const overlay = (function () {
    const stack = [];
    const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

    function open(el, onOpen) {
      if (!el || stack.includes(el)) return;
      stack.push(el);
      el.hidden = false;
      document.body.classList.add('is-locked');
      el._restore = document.activeElement;
      requestAnimationFrame(() => {
        el.classList.add('is-open');
        const first = el.querySelector('input:not([type="hidden"])') || el.querySelector(FOCUSABLE);
        first?.focus();
        onOpen?.();
      });
    }

    function close(el) {
      const target = el || stack[stack.length - 1];
      if (!target) return;
      const i = stack.indexOf(target);
      if (i > -1) stack.splice(i, 1);
      target.classList.remove('is-open');
      if (!stack.length) document.body.classList.remove('is-locked');
      const restore = target._restore;
      setTimeout(() => {
        /* A reopen inside the fade-out window must win over this cleanup. */
        if (stack.includes(target)) return;
        target.hidden = true;
        if (restore && document.contains(restore)) restore.focus();
      }, 300);
    }

    function closeTop() { if (stack.length) close(stack[stack.length - 1]); }
    function isOpen() { return stack.length > 0; }

    /* Backdrop click + close buttons. */
    document.addEventListener('click', (e) => {
      if (e.target.matches('.palette, .modal')) close(e.target);
      const btn = e.target.closest('[data-close]');
      if (btn) close(btn.closest('.palette, .modal'));
    });

    /* Keep Tab inside the topmost overlay. */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !stack.length) return;
      const top = stack[stack.length - 1];
      const items = $$(FOCUSABLE, top).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return { open, close, closeTop, isOpen, stack };
  })();

  /* ========================================================
     CUSTOM CURSOR
     ======================================================== */
  if (!isTouch) {
    const cur = $('#cursor');
    const dot = $('#cursorDot');
    const label = $('#cursorLabel');
    let x = 0, y = 0, dx = 0, dy = 0;

    document.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      cur.classList.add('is-on');
      dot.classList.add('is-on');
    }, { passive: true });

    /* The ring eases behind the dot; the dot is pinned to the pointer. */
    (function follow() {
      dx += (x - dx) * 0.18;
      dy += (y - dy) * 0.18;
      cur.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    })();

    document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
    document.addEventListener('pointerup',   () => cur.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => {
      cur.classList.remove('is-on'); dot.classList.remove('is-on');
    });

    document.addEventListener('pointerover', (e) => {
      const hot = e.target.closest('a, button, input, textarea, .value, .skill, .stat, .tl__head');
      cur.classList.toggle('is-hover', !!hot);
      const text = hot?.getAttribute('data-cursor');
      label.textContent = text || '';
      cur.classList.toggle('has-label', !!text);
    });
  }

  /* ========================================================
     SPOTLIGHT
     ======================================================== */
  if (!isTouch && !reduced) {
    const spot = $('#spotlight');
    let sx = 50, sy = 30, tx = 50, ty = 30, spotRaf = null;
    document.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
      if (!spotRaf) spotRaf = requestAnimationFrame(moveSpot);
    }, { passive: true });
    function moveSpot() {
      sx += (tx - sx) * 0.08;
      sy += (ty - sy) * 0.08;
      spot.style.setProperty('--mx', sx + '%');
      spot.style.setProperty('--my', sy + '%');
      spotRaf = Math.abs(tx - sx) > 0.1 || Math.abs(ty - sy) > 0.1
        ? requestAnimationFrame(moveSpot) : null;
    }
  }

  /* ========================================================
     NAV — sticky state, hide on scroll down, active link
     ======================================================== */
  const nav = $('#nav');
  const navLinks = $$('.nav__links a');
  const indicator = $('.nav__indicator');
  const sections = $$('main section[id], .hero');

  function moveIndicator(link) {
    if (!indicator || !link) return;
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    indicator.style.opacity = '1';
  }

  function setActive(id) {
    let active = null;
    navLinks.forEach((a) => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) active = a;
    });
    $$('.dots button').forEach((b) => b.classList.toggle('is-active', b.dataset.target === id));
    if (active) moveIndicator(active);
    else if (indicator) indicator.style.opacity = '0';
  }

  /* ---- section dots ---- */
  (function buildDots() {
    const host = $('#dots');
    if (!host) return;
    host.innerHTML = sections.map((s) =>
      `<button data-target="${s.id}" data-label="${esc(s.dataset.section || s.id)}" aria-label="Go to ${esc(s.dataset.section || s.id)}"></button>`
    ).join('');
    $$('button', host).forEach((b) => {
      b.addEventListener('click', () => {
        goTo(b.dataset.target);
      });
    });
  })();

  /* ---- scroll bookkeeping ---- */
  const scrollBar = $('#scrollBar');
  const toTop = $('#toTop');
  const toTopFill = $('#toTopFill');
  const dotsHost = $('#dots');
  let lastY = window.scrollY;
  let scrollRaf = null;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, y / max) : 0;

    if (scrollBar) scrollBar.style.width = (pct * 100) + '%';
    if (toTopFill) toTopFill.style.strokeDashoffset = String(100.5 * (1 - pct));

    nav?.classList.toggle('is-stuck', y > 24);
    /* Hide the bar when diving down the page, reveal on any scroll up. */
    const goingDown = y > lastY && y > 320;
    if (!overlay.isOpen()) nav?.classList.toggle('is-hidden', goingDown);
    lastY = y;

    toTop?.classList.toggle('is-on', y > 600);
    dotsHost?.classList.toggle('is-on', y > 400);
    scrollRaf = null;
  }

  window.addEventListener('scroll', () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  toTop?.addEventListener('click', goToTop);

  /* ---- which section am I in ---- */
  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio));
      let best = null, bestRatio = 0;
      seen.forEach((ratio, id) => { if (ratio > bestRatio) { bestRatio = ratio; best = id; } });
      if (best) setActive(best);
    }, { threshold: [0.12, 0.3, 0.55, 0.8], rootMargin: '-15% 0px -35% 0px' });
    sections.forEach((s) => io.observe(s));
  }
  window.addEventListener('resize', () => {
    const active = $('.nav__links a.is-active');
    if (active) moveIndicator(active);
  });

  /* ========================================================
     MOBILE SHEET
     ======================================================== */
  (function mobileMenu() {
    const btn = $('#hamburger');
    const sheet = $('#mobileMenu');
    if (!btn || !sheet) return;

    function setOpen(open) {
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        sheet.hidden = false;
        requestAnimationFrame(() => {
          sheet.classList.add('is-open');
          /* Stagger the links in. */
          $$('.sheet__links a', sheet).forEach((a, i) => {
            a.style.animationDelay = (i * 45) + 'ms';
          });
        });
        document.body.classList.add('is-locked');
      } else {
        sheet.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        setTimeout(() => { sheet.hidden = true; }, 380);
      }
    }

    btn.addEventListener('click', () => setOpen(sheet.hidden));
    $$('.sheet__links a, .sheet__foot a', sheet).forEach((a) =>
      a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sheet.hidden) setOpen(false);
    });
    window.sheetClose = () => { if (!sheet.hidden) setOpen(false); };
  })();

  /* ========================================================
     REVEAL ON SCROLL
     ======================================================== */
  function initReveal() {
    const items = $$('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('is-in'), i * 70);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ========================================================
     COUNTERS
     ======================================================== */
  (function counters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = target + suffix; return; }
      const dur = 1400;
      const start = performance.now();
      (function frame(now) {
        /* printCv() sets data-done so a mid-flight count cannot overwrite
           the final figure on the printed page. */
        if (el.dataset.done === '1') return;
        const p = Math.min(1, (now - start) / dur);
        /* easeOutExpo — fast out of the gate, gentle landing. */
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      })(start);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  })();

  /* ========================================================
     MAGNETIC BUTTONS / RIPPLE / TILT
     ======================================================== */
  if (!isTouch && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.22}px, ${my * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  document.addEventListener('pointerdown', (e) => {
    const host = e.target.closest('[data-ripple]');
    if (!host || reduced) return;
    const r = host.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const ink = document.createElement('span');
    ink.className = 'ripple';
    ink.style.width = ink.style.height = size + 'px';
    ink.style.left = (e.clientX - r.left - size / 2) + 'px';
    ink.style.top = (e.clientY - r.top - size / 2) + 'px';
    host.appendChild(ink);
    ink.addEventListener('animationend', () => ink.remove(), { once: true });
  });

  function initTilt() {
    if (isTouch || reduced) return;
    $$('[data-tilt]').forEach((el) => {
      if (el._tilt) return;
      el._tilt = true;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg) translateZ(0)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ========================================================
     TYPEWRITER + NAME SCRAMBLE
     ======================================================== */
  const typewriter = (function () {
    const el = $('#typewriter');
    let timer = null;
    let idx = 0, char = 0, deleting = false;

    function tick() {
      const list = D.roles[lang] || D.roles.en;
      const word = list[idx % list.length];
      char += deleting ? -1 : 1;
      el.textContent = word.slice(0, char);

      let delay = deleting ? 45 : 85;
      if (!deleting && char === word.length) { delay = 1700; deleting = true; }
      else if (deleting && char === 0) { deleting = false; idx++; delay = 320; }
      timer = setTimeout(tick, delay);
    }

    return {
      start() {
        if (!el) return;
        if (reduced) { el.textContent = (D.roles[lang] || D.roles.en)[0]; return; }
        clearTimeout(timer);
        tick();
      },
      reset() {
        if (!el || reduced) { if (el) el.textContent = (D.roles[lang] || D.roles.en)[0]; return; }
        clearTimeout(timer);
        idx = 0; char = 0; deleting = false;
        tick();
      }
    };
  })();
  typewriter.start();

  if (!reduced) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@*';
    $$('.scramble').forEach((el) => {
      const final = el.dataset.text || el.textContent;
      let raf = null, frame = 0;
      el.addEventListener('pointerenter', () => {
        cancelAnimationFrame(raf);
        frame = 0;
        (function run() {
          /* Each letter locks in after (index * 2) frames. */
          el.textContent = final.split('').map((ch, i) => {
            if (ch === ' ') return ' ';
            if (frame >= i * 2 + 6) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join('');
          frame++;
          if (frame < final.length * 2 + 8) raf = requestAnimationFrame(run);
          else el.textContent = final;
        })();
      });
    });
  }

  /* ========================================================
     LOCAL CLOCK + AVAILABILITY STATUS
     ======================================================== */
  const TZ = 'Asia/Jakarta';

  function wibParts() {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
    return { hour: Number(parts.hour), minute: parts.minute, weekday: parts.weekday };
  }

  function updateClock() {
    const el = $('#localTime');
    if (!el) return;
    const p = wibParts();
    el.textContent = `${String(p.hour).padStart(2, '0')}:${p.minute}`;
  }

  function updateStatus() {
    const chip = $('#statusChip');
    const text = $('#statusText');
    if (!chip || !text) return;
    const { hour, weekday } = wibParts();
    const weekend = weekday === 'Sun';

    let state = 'away', copy = D.ui.statusAway;
    if (hour >= 8 && hour < 20 && !weekend) { state = 'open'; copy = D.ui.statusOpen; }
    else if (hour >= 7 && hour < 22) { state = 'busy'; copy = D.ui.statusBusy; }

    chip.dataset.status = state;
    text.textContent = t(copy);
  }

  updateClock();
  updateStatus();
  setInterval(updateClock, 15000);
  setInterval(updateStatus, 300000);

  $('#statusChip')?.addEventListener('click', () => goTo('contact'));

  /* ========================================================
     COPY TO CLIPBOARD
     ======================================================== */
  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        /* file:// and plain http fall back to the legacy path. */
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      toast(t(D.ui.copied));
      return true;
    } catch {
      toast(t(D.ui.copyFailed), 'error');
      return false;
    }
  }

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const ok = await copyText(btn.dataset.copy);
    if (!ok) return;
    btn.classList.add('is-done');
    setTimeout(() => btn.classList.remove('is-done'), 1400);
  });

  /* ========================================================
     PRINT CV
     ======================================================== */
  function printCv() {
    toast(t(D.ui.printing));
    /* Open every timeline panel so the printed CV is complete, and fill any
       skill bar the reader never scrolled past — those animate in on view. */
    $$('.tl').forEach((li) => li.classList.add('is-open'));
    $$('.skill__bar i').forEach((bar) => { bar.style.width = bar.dataset.lvl + '%'; });
    $$('[data-count]').forEach((el) => {
      el.dataset.done = '1';
      el.textContent = (el.dataset.count || '0') + (el.dataset.suffix || '');
    });
    /* A fixed, translated wrapper would print only the first screen. */
    const wasSmooth = !!(smooth && smooth.isEnabled);
    if (wasSmooth) smooth.disable();
    if (wasSmooth) {
      window.addEventListener('afterprint', () => smooth.enable(), { once: true });
    }
    setTimeout(() => window.print(), 400);
  }
  $('#printCv')?.addEventListener('click', printCv);
  $('#printCv2')?.addEventListener('click', printCv);

  /* ========================================================
     CONTACT FORM
     ======================================================== */
  (function contactForm() {
    const form = $('#contactForm');
    if (!form) return;

    const fields = {
      name:    $('#cName'),
      email:   $('#cEmail'),
      subject: $('#cSubject'),
      message: $('#cMessage')
    };
    const honeypot = $('#cCompany');
    const counter = $('#charCount');
    const draftNote = $('#draftNote');
    const DRAFT_KEY = 'da_contact_draft';

    /* ---- draft persistence ---- */
    function saveDraft() {
      const data = Object.fromEntries(Object.entries(fields).map(([k, el]) => [k, el.value]));
      const any = Object.values(data).some((v) => v.trim());
      if (!any) { store.del(DRAFT_KEY); draftNote.hidden = true; return; }
      store.set(DRAFT_KEY, JSON.stringify(data));
      draftNote.hidden = false;
    }

    (function loadDraft() {
      const raw = store.get(DRAFT_KEY, null);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        Object.entries(fields).forEach(([k, el]) => { if (data[k]) el.value = data[k]; });
        draftNote.hidden = false;
        if (counter) counter.textContent = fields.message.value.length;
      } catch { store.del(DRAFT_KEY); }
    })();

    $('#draftClear')?.addEventListener('click', () => {
      Object.values(fields).forEach((el) => { el.value = ''; });
      Object.values(fields).forEach(clearError);
      store.del(DRAFT_KEY);
      draftNote.hidden = true;
      if (counter) counter.textContent = '0';
      toast(t(D.ui.draftClear));
    });

    /* ---- validation ---- */
    function setError(el, msg) {
      const wrap = el.closest('.field');
      wrap.classList.add('has-error');
      wrap.classList.remove('is-valid');
      const slot = wrap.querySelector('[data-err]');
      if (slot) slot.textContent = msg;
      el.setAttribute('aria-invalid', 'true');
    }

    function clearError(el) {
      const wrap = el.closest('.field');
      wrap.classList.remove('has-error');
      const slot = wrap.querySelector('[data-err]');
      if (slot) slot.textContent = '';
      el.removeAttribute('aria-invalid');
    }

    function markValid(el) {
      clearError(el);
      el.closest('.field').classList.add('is-valid');
    }

    function validate(el, quiet) {
      const v = el.value.trim();
      if (el === fields.name) {
        if (!v) { if (!quiet) setError(el, t(D.ui.required)); return false; }
        markValid(el); return true;
      }
      if (el === fields.email) {
        if (!v) { if (!quiet) setError(el, t(D.ui.required)); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
          if (!quiet) setError(el, t(D.ui.badEmail)); return false;
        }
        markValid(el); return true;
      }
      if (el === fields.message) {
        if (!v) { if (!quiet) setError(el, t(D.ui.required)); return false; }
        if (v.length < 10) { if (!quiet) setError(el, t(D.ui.tooShort)); return false; }
        markValid(el); return true;
      }
      return true;
    }

    [fields.name, fields.email, fields.message].forEach((el) => {
      el.addEventListener('blur', () => validate(el, false));
      el.addEventListener('input', () => {
        if (el.closest('.field').classList.contains('has-error')) validate(el, false);
        saveDraft();
      });
    });
    fields.subject.addEventListener('input', saveDraft);

    fields.message.addEventListener('input', () => {
      if (counter) counter.textContent = fields.message.value.length;
    });

    function validateAll() {
      const results = [fields.name, fields.email, fields.message].map((el) => validate(el, false));
      return results.every(Boolean);
    }

    function payload() {
      const name = fields.name.value.trim();
      const email = fields.email.value.trim();
      const subject = fields.subject.value.trim() || `Portfolio enquiry from ${name}`;
      const body =
        `${fields.message.value.trim()}\n\n—\n${name}\n${email}`;
      return { subject, body };
    }

    function afterSend() {
      store.del(DRAFT_KEY);
      draftNote.hidden = true;
      form.reset();
      if (counter) counter.textContent = '0';
      $$('.field', form).forEach((f) => f.classList.remove('is-valid', 'has-error'));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      /* Bots fill hidden inputs; humans never see this one. */
      if (honeypot && honeypot.value) return;
      if (!validateAll()) { toast(t(D.ui.formFix), 'error'); return; }
      const { subject, body } = payload();
      toast(t(D.ui.formOpened));
      window.location.href =
        `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      afterSend();
    });

    $('#sendWa')?.addEventListener('click', () => {
      if (honeypot && honeypot.value) return;
      if (!validateAll()) { toast(t(D.ui.formFix), 'error'); return; }
      const { subject, body } = payload();
      toast(t(D.ui.waOpened));
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(`*${subject}*\n\n${body}`)}`,
        '_blank', 'noopener');
      afterSend();
    });
  })();

  /* ========================================================
     COMMAND PALETTE
     ======================================================== */
  const palette = {
    el: $('#palette'),
    input: $('#paletteInput'),
    list: $('#paletteList'),
    items: [],
    shown: [],
    cursor: 0
  };

  function buildPaletteItems() {
    const jump = (id) => () => {
      overlay.close(palette.el);
      setTimeout(() => goTo(id), 180);
    };

    const nav = [
      ['Home', 'hero'], ['About', 'about'], ['Skills', 'skills'],
      ['Experience', 'experience'], ['Education', 'education'],
      ['Certificates', 'certificates'], ['Work', 'projects'], ['Contact', 'contact']
    ].map(([label, id]) => ({
      name: lang === 'id' ? ({
        Home: 'Beranda', About: 'Tentang', Skills: 'Keahlian', Experience: 'Pengalaman',
        Education: 'Pendidikan', Certificates: 'Sertifikat', Work: 'Karya', Contact: 'Kontak'
      })[label] : label,
      kind: lang === 'id' ? 'Bagian' : 'Section',
      icon: 'target',
      run: jump(id)
    }));

    const actions = [
      { name: lang === 'id' ? 'Ganti tema' : 'Toggle theme', icon: 'spark', run: toggleTheme },
      { name: lang === 'id' ? 'Bahasa: English' : 'Language: Indonesia', icon: 'chat',
        run: () => { overlay.close(palette.el); applyLang(lang === 'id' ? 'en' : 'id', true); } },
      { name: lang === 'id' ? 'Salin email' : 'Copy email', icon: 'box', run: () => copyText(EMAIL) },
      { name: lang === 'id' ? 'Salin nomor WhatsApp' : 'Copy WhatsApp number', icon: 'box', run: () => copyText('+' + WA) },
      { name: lang === 'id' ? 'Cetak / simpan CV' : 'Print / save CV', icon: 'scroll',
        run: () => { overlay.close(palette.el); setTimeout(printCv, 260); } },
      { name: lang === 'id' ? 'Pintasan keyboard' : 'Keyboard shortcuts', icon: 'code',
        run: () => { overlay.close(palette.el); setTimeout(() => overlay.open($('#shortcuts')), 260); } }
    ].map((a) => ({ ...a, kind: lang === 'id' ? 'Aksi' : 'Action' }));

    const accents = ['emerald', 'violet', 'amber', 'cyan', 'rose'].map((a) => ({
      name: (lang === 'id' ? 'Warna aksen: ' : 'Accent: ') + a,
      kind: lang === 'id' ? 'Tema' : 'Theme',
      icon: 'spark',
      run: () => applyAccent(a, true)
    }));

    const links = [
      { name: 'GitHub', href: 'https://github.com/DjorghiTzy' },
      { name: 'LinkedIn', href: 'https://www.linkedin.com/in/djorghi-andima-4b89b0423/' },
      { name: 'Instagram', href: 'https://www.instagram.com/djtzy__/' },
      { name: 'WhatsApp', href: 'https://wa.me/' + WA }
    ].map((l) => ({
      name: l.name, kind: lang === 'id' ? 'Tautan' : 'Link', icon: 'map',
      run: () => window.open(l.href, '_blank', 'noopener')
    }));

    palette.items = [...nav, ...actions, ...accents, ...links];
  }

  function paintPalette(query) {
    const q = query.trim().toLowerCase();
    palette.shown = q
      ? palette.items.filter((i) => (i.name + ' ' + i.kind).toLowerCase().includes(q))
      : palette.items;
    palette.cursor = 0;

    if (!palette.shown.length) {
      palette.list.innerHTML = `<li class="palette__empty">${lang === 'id' ? 'Tidak ada hasil' : 'No results'}</li>`;
      return;
    }
    palette.list.innerHTML = palette.shown.map((item, i) => `
      <li class="palette__item${i === 0 ? ' is-sel' : ''}" role="option" data-i="${i}" aria-selected="${i === 0}">
        ${svg(item.icon)}
        <span class="palette__name">${esc(item.name)}</span>
        <span class="palette__kind">${esc(item.kind)}</span>
      </li>`).join('');
  }

  function movePalette(delta) {
    if (!palette.shown.length) return;
    palette.cursor = (palette.cursor + delta + palette.shown.length) % palette.shown.length;
    $$('.palette__item', palette.list).forEach((li, i) => {
      const on = i === palette.cursor;
      li.classList.toggle('is-sel', on);
      li.setAttribute('aria-selected', String(on));
      if (on) li.scrollIntoView({ block: 'nearest' });
    });
  }

  function runPalette(i) {
    const item = palette.shown[i];
    if (!item) return;
    item.run();
    /* Actions that close the overlay themselves already did; closing
       an already-closed overlay is a no-op. */
    if (overlay.stack.includes(palette.el)) overlay.close(palette.el);
  }

  function openPalette() {
    buildPaletteItems();
    palette.input.value = '';
    paintPalette('');
    overlay.open(palette.el);
  }

  buildPaletteItems();
  $('#paletteOpen')?.addEventListener('click', openPalette);
  palette.input?.addEventListener('input', (e) => paintPalette(e.target.value));
  palette.list?.addEventListener('click', (e) => {
    const li = e.target.closest('.palette__item');
    if (li) runPalette(Number(li.dataset.i));
  });
  palette.list?.addEventListener('pointermove', (e) => {
    const li = e.target.closest('.palette__item');
    if (!li) return;
    palette.cursor = Number(li.dataset.i);
    $$('.palette__item', palette.list).forEach((n, i) =>
      n.classList.toggle('is-sel', i === palette.cursor));
  });
  palette.el?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); movePalette(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); movePalette(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runPalette(palette.cursor); }
  });

  /* ========================================================
     KEYBOARD SHORTCUTS
     ======================================================== */
  const sectionIds = sections.map((s) => s.id);

  function stepSection(delta) {
    const active = $('.dots button.is-active')?.dataset.target || sectionIds[0];
    const i = Math.max(0, sectionIds.indexOf(active));
    const next = sectionIds[Math.min(sectionIds.length - 1, Math.max(0, i + delta))];
    goTo(next);
  }

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.stack.includes(palette.el) ? overlay.close(palette.el) : openPalette();
      return;
    }
    if (e.key === 'Escape') {
      if (overlay.isOpen()) { e.preventDefault(); overlay.closeTop(); }
      else window.sheetClose?.();
      return;
    }
    if (overlay.stack.includes(detail.el)) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stepDetail(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepDetail(1); return; }
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || overlay.isOpen()) return;

    switch (e.key.toLowerCase()) {
      case 't': toggleTheme(); break;
      case 'l': toggleLang(); break;
      case 'c': copyText(EMAIL); break;
      case 'p': e.preventDefault(); printCv(); break;
      case 'j': stepSection(1); break;
      case 'k': stepSection(-1); break;
      case '?': overlay.open($('#shortcuts')); break;
      default: break;
    }
  });

  $('#themeToggle')?.addEventListener('click', toggleTheme);
  $('#langToggle')?.addEventListener('click', toggleLang);

  /* ========================================================
     EASTER EGG — Konami code
     ======================================================== */
  (function konami() {
    const SEQ = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
    let at = 0;
    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      at = (k === SEQ[at]) ? at + 1 : (k === SEQ[0] ? 1 : 0);
      if (at < SEQ.length) return;
      at = 0;
      burst();
      toast(t(D.ui.konami));
    });

    function burst() {
      if (reduced) return;
      const colors = ['#10b981', '#34d399', '#8b5cf6', '#f59e0b', '#06b6d4', '#f43f5e'];
      for (let i = 0; i < 90; i++) {
        const bit = document.createElement('i');
        bit.className = 'confetti';
        bit.style.left = Math.random() * 100 + 'vw';
        bit.style.background = colors[i % colors.length];
        bit.style.animationDuration = (2 + Math.random() * 2) + 's';
        bit.style.animationDelay = (Math.random() * 0.6) + 's';
        bit.style.opacity = String(0.6 + Math.random() * 0.4);
        document.body.appendChild(bit);
        bit.addEventListener('animationend', () => bit.remove(), { once: true });
      }
    }
  })();

  /* ========================================================
     SMOOTH IN-PAGE LINKS
     ======================================================== */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    goTo(target);
    history.replaceState(null, '', '#' + id);
  });

  /* ========================================================
     BOOT
     ======================================================== */
  $('#year').textContent = String(new Date().getFullYear());

  applyLang(lang, false);

  /* ---- background scene ----
     Preferred: the scroll-driven WebGL layer. It is loaded on demand so the
     ~130KB of three.js never reaches visitors who cannot or should not run
     it — no WebGL, reduced motion, or a data-saver connection. Those get the
     2D hero field instead, which is already in the bundle. */
  function startHeroFallback() {
    const heroCanvas = $('#heroCanvas');
    if (heroCanvas && window.HeroScene) window.heroScene = window.HeroScene.create(heroCanvas);
  }

  function scrollProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    /* The lerped offset, not raw scrollY: the scene must travel with the
       content, otherwise the background leads and the page feels detached. */
    const y = (smooth && smooth.isEnabled) ? smooth.offset : window.scrollY;
    return y / max;
  }

  const scenePointer = { x: 0, y: 0 };
  if (!isTouch) {
    document.addEventListener('pointermove', (e) => {
      scenePointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scenePointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  function webglSupported() {
    try {
      const probe = document.createElement('canvas');
      return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
    } catch { return false; }
  }

  const saveData = navigator.connection && navigator.connection.saveData;

  async function startBackground() {
    const sceneCanvas = $('#sceneCanvas');
    if (!sceneCanvas || reduced || saveData || !webglSupported()) {
      startHeroFallback();
      return;
    }
    try {
      const mod = await import('./scroll-scene.js');
      const scene = mod.createScrollScene({
        canvas: sceneCanvas,
        getProgress: scrollProgress,
        getPointer: () => scenePointer,
        quality: (isTouch || window.innerWidth < 760) ? 'low' : 'high'
      });
      window.scrollScene = scene;
      scene.start();
      sceneCanvas.classList.add('is-on');

      let sceneResize = null;
      window.addEventListener('resize', () => {
        clearTimeout(sceneResize);
        sceneResize = setTimeout(() => scene.resize(), 160);
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) scene.stop(); else scene.start();
      });
    } catch (err) {
      /* A blocked or failed module import must not cost the visitor the
         background entirely. */
      console.warn('WebGL background unavailable, using 2D fallback:', err);
      startHeroFallback();
    }
  }

  if (smooth) smooth.enable();
  startBackground();

  /* Landing on a deep link should not fight the reveal animations. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
})();
