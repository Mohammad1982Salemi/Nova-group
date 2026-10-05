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

  /* cards with .glow get a spotlight that follows the cursor */
  function initGlow() {
    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
    Array.prototype.forEach.call(document.querySelectorAll('.glow'), function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------------
     Home hero: a market-by-order book, simulated. Every level is a FIFO
     queue of individual orders. Three things happen, as in a real book:
     an order joins the back of a queue, an order is cancelled, or an
     aggressor trades against the front of the best level. When a best
     level is used up the book shifts a tick and the mid moves with it.
     --------------------------------------------------------------- */
  function initMbo() {
    var root = document.getElementById('mbo');
    if (!root) return;

    var TICK = 0.25, LEVELS = 5, MAX_QUEUE = 8, seq = 0;
    var asksEl = root.querySelector('.mbo-asks');
    var bidsEl = root.querySelector('.mbo-bids');
    var tapeEl = root.querySelector('.mbo-tape');
    var out = {
      spread: root.querySelector('[data-f="spread"]'),
      mid: root.querySelector('[data-f="mid"]'),
      last: root.querySelector('[data-f="last"]')
    };
    var asks = [], bids = [], tape = [], last = null;   // index 0 is always the best level

    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function fmt(p) { return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function order(fresh) { return { id: ++seq, q: Math.random() < 0.14 ? rnd(8, 24) : rnd(1, 6), fresh: fresh }; }
    function level(px, n) { var o = []; while (n-- > 0) o.push(order(false)); return { px: px, o: o }; }
    function total(l) { return l.o.reduce(function (s, o) { return s + o.q; }, 0); }
    function stamp() {
      var d = new Date();
      function p(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
      return p(d.getHours(), 2) + ':' + p(d.getMinutes(), 2) + ':' + p(d.getSeconds(), 2) + '.' + p(d.getMilliseconds(), 3);
    }

    function rowHtml(l, maxTotal) {
      var chips = l.o.map(function (o) {
        var html = '<span class="chip' + (o.fresh ? ' is-new' : '') + '" data-id="' + o.id + '" style="--q:' + Math.min(o.q, 24) + '">' + o.q + '</span>';
        o.fresh = false;
        return html;
      }).join('');
      var t = total(l);
      return '<div class="mbo-row" style="--depth:' + Math.round(100 * t / maxTotal) + '%">' +
        '<span class="px">' + fmt(l.px) + '</span><span class="q">' + chips + '</span>' +
        '<span class="tot">' + t + '</span><span class="cnt">' + l.o.length + '</span></div>';
    }

    function render() {
      var maxTotal = 1;
      asks.concat(bids).forEach(function (l) { maxTotal = Math.max(maxTotal, total(l)); });
      asksEl.innerHTML = asks.slice().reverse().map(function (l) { return rowHtml(l, maxTotal); }).join('');
      bidsEl.innerHTML = bids.map(function (l) { return rowHtml(l, maxTotal); }).join('');
      out.spread.textContent = (asks[0].px - bids[0].px).toFixed(2);
      out.mid.textContent = ((asks[0].px + bids[0].px) / 2)   // a half-tick mid needs its third decimal
        .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
      out.last.textContent = last === null ? '—' : fmt(last);
      tapeEl.innerHTML = tape.map(function (t) {
        var html = '<div class="tp ' + (t.buy ? 'buy' : 'sell') + (t.fresh ? ' is-new' : '') + '"><span>' + t.time + '</span>' +
          '<b>' + (t.buy ? 'BUY' : 'SELL') + '</b><span>' + t.q + '</span><span>@ ' + fmt(t.px) + '</span></div>';
        t.fresh = false;
        return html;
      }).join('');
    }

    function mark(ids, cls) {
      ids.forEach(function (id) {
        var chip = root.querySelector('.chip[data-id="' + id + '"]');
        if (chip) chip.classList.add(cls);
      });
    }
    function print(buy, q, px) {
      last = px;
      tape.unshift({ time: stamp(), buy: buy, q: q, px: px, fresh: true });
      if (tape.length > 3) tape.length = 3;
    }

    /* someone quotes inside the spread: a new best level on that side */
    function improve(book, dir) {
      book.unshift({ px: book[0].px + dir * TICK, o: [order(true)] });
      book.pop();
    }
    /* the best level is gone: the next one becomes best, and a far level appears */
    function shift(book, dir) {
      book.shift();
      book.push(level(book[book.length - 1].px + dir * TICK, rnd(3, 7)));
    }

    function step() {
      var spreadTicks = Math.round((asks[0].px - bids[0].px) / TICK);
      var r = Math.random();

      if (spreadTicks > 1 && r < 0.65) {
        if (Math.random() < 0.5) improve(bids, 1); else improve(asks, -1);
        return render();
      }

      if (r < 0.45) {                                   // an order joins the back of a queue
        var book = Math.random() < 0.5 ? bids : asks;
        var lvl = book[Math.min(LEVELS - 1, Math.floor(Math.pow(Math.random(), 1.6) * LEVELS))];
        if (lvl.o.length < MAX_QUEUE) lvl.o.push(order(true));
        return render();
      }

      if (r < 0.72) {                                   // a cancel, more often from the back
        var side = Math.random() < 0.5 ? bids : asks;
        var open = side.filter(function (l) { return l.o.length > 1; });
        if (!open.length) return;
        var from = open[rnd(0, open.length - 1)];
        var gone = from.o[rnd(Math.floor(from.o.length / 2), from.o.length - 1)];
        mark([gone.id], 'is-out');
        return setTimeout(function () {
          from.o.splice(from.o.indexOf(gone), 1);
          render();
        }, 260);
      }

      var buy = Math.random() < 0.5;                    // a trade against the front of the best level
      var hitBook = buy ? asks : bids, best = hitBook[0];
      var want = rnd(1, 9), left = want, hit = [];
      for (var k = 0; k < best.o.length && left > 0; k++) { hit.push(best.o[k].id); left -= best.o[k].q; }
      mark(hit, 'is-hit');
      setTimeout(function () {
        var rem = want, done = 0;
        while (rem > 0 && best.o.length) {
          var front = best.o[0], take = Math.min(front.q, rem);
          front.q -= take; rem -= take; done += take;
          if (!front.q) best.o.shift();
        }
        print(buy, done, best.px);
        if (!best.o.length) shift(hitBook, buy ? 1 : -1);
        render();
      }, 260);
    }

    var base = 5124, i;
    for (i = 0; i < LEVELS; i++) {
      asks.push(level(base + TICK * (i + 1), rnd(2, 4) + i));
      bids.push(level(base - TICK * i, rnd(2, 4) + i));
    }
    print(false, rnd(1, 6), bids[0].px);
    print(true, rnd(1, 6), asks[0].px);
    tape.forEach(function (t) { t.fresh = false; });
    render();

    if (reduceMotion || !('IntersectionObserver' in window)) return;   // a still book is fine

    var timer = null, onScreen = false;
    function tick() {
      timer = null;
      if (!onScreen || document.hidden) return;
      step();
      timer = setTimeout(tick, rnd(420, 900));
    }
    function start() { if (!timer) timer = setTimeout(tick, 500); }

    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start();
    }).observe(root);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && onScreen) start(); });
  }

  function boot() {
    initLang();
    initNav();
    initReveal();
    initToc();
    initGlow();
    initMbo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
