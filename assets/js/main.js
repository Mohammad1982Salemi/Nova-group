/* Nova Group — landing page interactions */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     language: fa (RTL) <-> en (LTR)
     --------------------------------------------------------------- */
  var STORAGE_KEY = 'nova-lang';
  var DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, function (d) { return DIGITS[+d]; });
  }

  function localizeNumber(value, lang) {
    return lang === 'fa' ? toPersianDigits(value) : String(value);
  }

  function detectLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage blocked */ }
    if (saved === 'fa' || saved === 'en') return saved;
    return (navigator.language || '').toLowerCase().indexOf('fa') === 0 ? 'fa' : 'en';
  }

  function applyLang(lang) {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    // re-render every counted number in the right numeral system
    counters.forEach(function (counter) { renderCount(counter, counter.dataset.value); });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage blocked */ }
  }

  /* ---------------------------------------------------------------
     counters (stats + floating cards)
     --------------------------------------------------------------- */
  var counters = [];

  function writeCount(el, text) {
    var target = el.querySelector('.fc-num') || el;
    target.textContent = text;
  }

  function renderCount(counter, value) {
    var lang = html.getAttribute('data-lang') || 'fa';
    var text = localizeNumber(Math.round(value), lang) + (counter.dataset.suffix || '');
    writeCount(counter, text);
  }

  function animateCount(counter) {
    var end = parseFloat(counter.dataset.count) || 0;
    var duration = 1500;
    var start = performance.now();
    counter.dataset.value = 0;

    if (reduceMotion) {
      counter.dataset.value = end;
      renderCount(counter, end);
      return;
    }

    (function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var current = end * eased;
      counter.dataset.value = current;
      renderCount(counter, current);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function initCounters() {
    counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    counters.forEach(function (counter) {
      counter.dataset.value = 0;
      renderCount(counter, 0);
    });
  }

  /* ---------------------------------------------------------------
     language button
     --------------------------------------------------------------- */
  function initLangButton() {
    var btn = document.getElementById('langBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-lang') === 'fa' ? 'en' : 'fa';
      applyLang(next);
    });
  }

  /* ---------------------------------------------------------------
     nav: scroll state, mobile menu, active section
     --------------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    var links = document.getElementById('navLinks');
    var toTop = document.getElementById('toTop');

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle('is-scrolled', y > 12);
      toTop.classList.toggle('is-visible', y > 620);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function closeMenu() {
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }

    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeMenu();
    });

    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------
     reveal on scroll
     --------------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.slice.call(el.parentElement.children).filter(function (n) {
          return n.classList.contains('reveal');
        });
        var index = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(index, 5) * 80 + 'ms';
        el.classList.add('is-in');
        observer.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------
     each counter animates the first time it enters the viewport
     (hero cards fire on load, the stats strip on scroll)
     --------------------------------------------------------------- */
  function initCounterTriggers() {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCount);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (counter) { observer.observe(counter); });
  }

  /* ---------------------------------------------------------------
     cursor-tracked glow on project cards
     --------------------------------------------------------------- */
  function initCardGlow() {
    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.project').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------------
     boot
     --------------------------------------------------------------- */
  function boot() {
    initCounters();
    applyLang(detectLang());
    initLangButton();
    initNav();
    initReveal();
    initCounterTriggers();
    initCardGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
