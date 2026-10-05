/* Nova Group — shared page behaviour. The language itself is applied by the
   inline script in <head>, before first paint; this file only switches it. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initLang() {
    var btn = document.getElementById('langBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var lang = html.getAttribute('data-lang') === 'fa' ? 'en' : 'fa';
      html.setAttribute('data-lang', lang);
      html.lang = lang;
      html.dir = lang === 'fa' ? 'rtl' : 'ltr';
      try { localStorage.setItem('nova-lang', lang); } catch (e) { /* storage blocked */ }
    });
  }

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
    links.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760) closeMenu(); });

    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* case-study pages: mark the section being read in the contents list */
  function initToc() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (document.getElementById(id)) byId[id] = a;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        byId[entry.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-25% 0px -65% 0px' });

    Object.keys(byId).forEach(function (id) { observer.observe(document.getElementById(id)); });
  }

  function boot() {
    initLang();
    initNav();
    initReveal();
    initToc();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
