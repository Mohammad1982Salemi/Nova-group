/* Nova Group — landing page interactions */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     language: fa (RTL) <-> en (LTR)
     --------------------------------------------------------------- */
  var STORAGE_KEY = 'nova-lang';

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
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage blocked */ }
  }

  function initLangButton() {
    var btn = document.getElementById('langBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyLang(html.getAttribute('data-lang') === 'fa' ? 'en' : 'fa');
    });
  }

  /* ---------------------------------------------------------------
     nav: scroll state, mobile menu, back to top
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
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 80 + 'ms';
        el.classList.add('is-in');
        observer.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { observer.observe(el); });
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
    applyLang(detectLang());
    initLangButton();
    initNav();
    initReveal();
    initCardGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
