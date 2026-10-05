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
     aggressor trades against the front of the best level. Order flow leans
     one way for a while, so levels get used up, the book shifts a tick at a
     time and the price actually travels.
     --------------------------------------------------------------- */
  function initMbo() {
    var root = document.getElementById('mbo');
    if (!root) return;

    var TICK = 0.25, LEVELS = 5, MAX_QUEUE = 8, HISTORY = 90, seq = 0;
    var asksEl = root.querySelector('.mbo-asks');
    var bidsEl = root.querySelector('.mbo-bids');
    var tapeEl = root.querySelector('.mbo-tape');
    var sparkLine = root.querySelector('.mbo-spark polyline');
    var sparkDot = root.querySelector('.mbo-spark path');
    var out = {
      spread: root.querySelector('[data-f="spread"]'),
      mid: root.querySelector('[data-f="mid"]'),
      last: root.querySelector('[data-f="last"]')
    };
    var asks = [], bids = [], tape = [], mids = [];   // index 0 is always the best level
    var last = null, lastDir = 0;
    var bias = 0, biasLeft = 0;     // order flow leans one way for a while, then changes its mind
    var warming = true, pending = false;

    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function fmt(p) { return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function order() { return { id: ++seq, q: Math.random() < 0.14 ? rnd(8, 24) : rnd(1, 6), fresh: !warming }; }
    function level(px, n) { var o = []; while (n-- > 0) { var x = order(); x.fresh = false; o.push(x); } return { px: px, o: o }; }
    function total(l) { return l.o.reduce(function (s, o) { return s + o.q; }, 0); }
    function mid() { return (asks[0].px + bids[0].px) / 2; }
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

    /* the path the mid has taken, newest at the right edge */
    function drawSpark() {
      if (!sparkLine || !mids.length) return;
      var lo = Math.min.apply(null, mids), hi = Math.max.apply(null, mids);
      var pad = Math.max(0, 6 * TICK - (hi - lo)) / 2;   // never zoom in past a few ticks
      lo -= pad; hi += pad;
      var n = mids.length, pts = [], x = 0, y = 0;
      for (var j = 0; j < n; j++) {
        x = 3 + 294 * (j + HISTORY - n) / (HISTORY - 1);
        y = 36 - 32 * (mids[j] - lo) / (hi - lo);
        pts.push(x.toFixed(1) + ',' + y.toFixed(1));
      }
      sparkLine.setAttribute('points', pts.join(' '));
      sparkDot.setAttribute('d', 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h0');
    }

    function render() {
      var maxTotal = 1;
      asks.concat(bids).forEach(function (l) { maxTotal = Math.max(maxTotal, total(l)); });
      asksEl.innerHTML = asks.slice().reverse().map(function (l) { return rowHtml(l, maxTotal); }).join('');
      bidsEl.innerHTML = bids.map(function (l) { return rowHtml(l, maxTotal); }).join('');
      out.spread.textContent = (asks[0].px - bids[0].px).toFixed(2);
      out.mid.textContent = mid()   // a half-tick mid needs its third decimal
        .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
      out.last.textContent = last === null ? '—' : fmt(last);
      out.last.className = lastDir > 0 ? 'up' : lastDir < 0 ? 'down' : '';
      tapeEl.innerHTML = tape.map(function (t) {
        var html = '<div class="tp ' + (t.buy ? 'buy' : 'sell') + (t.fresh ? ' is-new' : '') + '"><span>' + t.time + '</span>' +
          '<b>' + (t.buy ? 'BUY' : 'SELL') + '</b><span>' + t.q + '</span><span>@ ' + fmt(t.px) + '</span></div>';
        t.fresh = false;
        return html;
      }).join('');
      drawSpark();
    }

    /* one frame: remember where the mid is, then redraw */
    function frame() {
      mids.push(mid());
      if (mids.length > HISTORY) mids.shift();
      if (!warming) render();
    }

    function mark(ids, cls) {
      if (warming) return;
      ids.forEach(function (id) {
        var chip = root.querySelector('.chip[data-id="' + id + '"]');
        if (chip) chip.classList.add(cls);
      });
    }
    /* show the change first (a flash or a fade), then apply it */
    function commit(fn) {
      if (warming) return fn();
      pending = true;
      setTimeout(function () { pending = false; fn(); frame(); }, 110);
    }
    function print(buy, q, px) {
      if (last !== null && px !== last) lastDir = px > last ? 1 : -1;
      last = px;
      tape.unshift({ time: stamp(), buy: buy, q: q, px: px, fresh: !warming });
      if (tape.length > 3) tape.length = 3;
    }

    /* someone quotes inside the spread: a new best level on that side */
    function improve(book, dir) {
      book.unshift({ px: book[0].px + dir * TICK, o: [order()] });
      book.pop();
    }
    /* the best level is gone: the next one becomes best, and a far level appears */
    function shift(book, dir) {
      book.shift();
      book.push(level(book[book.length - 1].px + dir * TICK, rnd(3, 7)));
    }

    function step() {
      if (--biasLeft <= 0) {
        bias = Math.random() < 0.22 ? 0 : Math.random() * 1.7 - 0.85;
        biasLeft = rnd(14, 42);
      }
      var up = Math.random() < 0.5 + 0.4 * bias;         // which way this event leans
      var spreadTicks = Math.round((asks[0].px - bids[0].px) / TICK);
      var r = Math.random();

      if (spreadTicks > 2 || (spreadTicks > 1 && r < 0.72)) {                 // the spread closes from the stronger side
        if (up) improve(bids, 1); else improve(asks, -1);
        return;
      }

      if (r < 0.47) {                                    // an order joins the back of a queue
        var book = Math.random() < 0.68 ? (up ? bids : asks) : (up ? asks : bids);
        var lvl = book[Math.min(LEVELS - 1, Math.floor(Math.pow(Math.random(), 1.25) * LEVELS))];
        if (lvl.o.length < MAX_QUEUE) lvl.o.push(order());
        return;
      }

      if (r < 0.65) {                                    // a cancel: liquidity backs away from pressure
        var side = up ? asks : bids;
        var open = side.filter(function (l) { return l.o.length > 1; });
        if (!open.length) return;
        var from = Math.random() < 0.5 ? open[0] : open[rnd(0, open.length - 1)];
        var gone = from.o[rnd(Math.floor(from.o.length / 2), from.o.length - 1)];
        mark([gone.id], 'is-out');
        return commit(function () { from.o.splice(from.o.indexOf(gone), 1); });
      }

      /* a trade. Most are small; some are large enough to sweep through levels */
      var buy = up, hitBook = buy ? asks : bids;
      var s = Math.random(), want = s < 0.66 ? rnd(1, 6) : s < 0.91 ? rnd(6, 18) : rnd(20, 44);
      var first = hitBook[0], left = want, hit = [];
      for (var k = 0; k < first.o.length && left > 0; k++) { hit.push(first.o[k].id); left -= first.o[k].q; }
      mark(hit, 'is-hit');
      commit(function () {
        var rem = want, done = 0, px = hitBook[0].px, swept = 0;
        while (rem > 0 && swept < 3) {
          var lv = hitBook[0];
          px = lv.px;
          while (rem > 0 && lv.o.length) {
            var front = lv.o[0], take = Math.min(front.q, rem);
            front.q -= take; rem -= take; done += take;
            if (!front.q) lv.o.shift();
          }
          if (lv.o.length) break;
          shift(hitBook, buy ? 1 : -1);
          swept++;
        }
        print(buy, done, px);
      });
    }

    var base = 5124, i;
    for (i = 0; i < LEVELS; i++) {
      asks.push(level(base + TICK * (i + 1), rnd(1, 3) + i));
      bids.push(level(base - TICK * i, rnd(1, 3) + i));
    }
    for (i = 0; i < 160; i++) { step(); frame(); }      // arrive with a market already in motion
    tape.length = 0;
    warming = false;
    render();

    if (reduceMotion || !('IntersectionObserver' in window)) return;   // a still book is fine

    var timer = null, onScreen = false;
    function tick() {
      timer = null;
      if (!onScreen || document.hidden) return;
      step();
      if (!pending) frame();
      timer = setTimeout(tick, rnd(150, 360));
    }
    function start() { if (!timer) timer = setTimeout(tick, 400); }

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
