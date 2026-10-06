/* Nova Group — shared page behaviour. Each language has its own page; which one a
   reader lands on is settled by the inline script in <head>, before first paint. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fa = html.lang === 'fa';
  var returning = false;      // arrived from the same page in the other language, at the same place

  /* The language button is a plain link to the same page in the other language. Here the choice is
     remembered, and the reader is put back at the paragraph they were reading. */
  function initLang() {
    var btn = document.getElementById('langBtn');
    if (!btn) return;

    if (btn.tagName !== 'A') {      // the not-found page carries both languages and switches in place
      var apply = function () {
        var lang = html.getAttribute('data-lang') === 'fa' ? 'en' : 'fa';
        html.setAttribute('data-lang', lang);
        html.lang = lang;
        html.dir = lang === 'fa' ? 'rtl' : 'ltr';
        try { localStorage.setItem('nova-lang', lang); } catch (e) { /* storage blocked */ }
      };
      btn.addEventListener('click', function () {
        if (!reduceMotion && document.startViewTransition) document.startViewTransition(apply);
        else apply();
      });
      return;
    }

    var KEY = 'nova-place', to = btn.getAttribute('hreflang'), dest = btn.href;
    // both languages have the same blocks in the same order, so a block's number finds it again
    function blocks() { return Array.prototype.slice.call(document.querySelectorAll('main h1, main h2, main h3, main p, main li, main figure')); }
    function line() { var nav = document.getElementById('nav'); return (nav ? nav.offsetHeight : 0) + 12; }

    btn.addEventListener('click', function (e) {
      var kept = true, list = blocks(), top = line(), i, r;
      try { localStorage.setItem('nova-lang', to); } catch (err) { kept = false; }
      for (i = 0; i < list.length; i++) {
        r = list[i].getBoundingClientRect();
        if (r.height && r.bottom > top) break;
      }
      if (window.scrollY > 60 && i < list.length) {
        try { sessionStorage.setItem(KEY, JSON.stringify({ to: to, i: i, f: (top - r.top) / r.height })); } catch (err) { /* no place kept */ }
      }
      if (!kept) {                  // nothing can be remembered in this browser: carry the choice in the address
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = dest + '?lang=' + to;
      }
    });

    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch (err) { /* none */ }
    if (!saved || saved.to !== html.lang) return;
    var mark = blocks()[saved.i], last = -1;
    if (!mark) return;
    function settle() {
      var r = mark.getBoundingClientRect();
      last = Math.max(0, Math.round(window.scrollY + r.top + saved.f * r.height - line()));
      window.scrollTo({ top: last, behavior: 'instant' });
    }
    returning = true;
    html.classList.add('is-returning');
    settle();
    // the web font may land a moment later and move the lines: settle once more, unless the reader has moved on
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (Math.abs(window.scrollY - last) < 4) settle(); });
    }
    setTimeout(function () { html.classList.remove('is-returning'); }, 400);
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
      var room = document.documentElement.scrollHeight - window.innerHeight;   // how far the page has been read
      toTop.style.setProperty('--p', room > 0 ? Math.min(100, y / room * 100).toFixed(1) : 0);
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
    if (reduceMotion || returning || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      // things that arrive together come in one after another, not all at once
      var step = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, delay = Math.min(step++, 6) * 80;
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-in');
        observer.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, delay + 1000);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    function start() { items.forEach(function (el) { observer.observe(el); }); }
    // on the first visit the opening plays first
    if (html.classList.contains('intro')) {
      setTimeout(start, 2550);
      setTimeout(function () { html.classList.remove('intro'); }, 3500);
    } else start();
  }

  /* case-study pages: mark the section being read in the contents list */
  function initToc() {
    // on a project page the section links follow the reader in a bar under the header
    var toc = document.querySelector('.page-hero .toc'), article = document.querySelector('.cs-body');
    if (toc && article) {
      var bar = document.createElement('div'), inner = document.createElement('div'), fill = document.createElement('i');
      var copy = toc.cloneNode(true);
      bar.className = 'tocbar';
      inner.className = 'wrap';
      fill.className = 'tocbar-fill';
      copy.classList.remove('reveal', 'is-in');
      copy.setAttribute('aria-label', fa ? 'در این صفحه، سنجاق‌شده' : 'On this page, pinned');
      inner.appendChild(copy);
      bar.appendChild(inner);
      bar.appendChild(fill);
      document.body.appendChild(bar);
      var nav = document.getElementById('nav');
      var place = function () {
        var top = toc.getBoundingClientRect(), box = article.getBoundingClientRect(), vh = window.innerHeight;
        bar.classList.toggle('is-on', top.bottom < nav.offsetHeight && box.bottom > vh * 0.4);
        var read = (vh * 0.4 - box.top) / Math.max(1, box.height);
        fill.style.transform = 'scaleX(' + Math.min(1, Math.max(0, read)).toFixed(3) + ')';
      };
      window.addEventListener('scroll', place, { passive: true });
      window.addEventListener('resize', place);
      place();
    }

    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (document.getElementById(id)) (byId[id] = byId[id] || []).push(a);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        byId[entry.target.id].forEach(function (a) { a.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });

    Object.keys(byId).forEach(function (id) { observer.observe(document.getElementById(id)); });

    // above the first section nothing is current; a jump straight to the top crosses no section on the way
    var first = document.getElementById(Object.keys(byId)[0]);
    window.addEventListener('scroll', function () {
      if (first.getBoundingClientRect().top > window.innerHeight * 0.35) links.forEach(function (a) { a.removeAttribute('aria-current'); });
    }, { passive: true });
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

  /* ---------------------------------------------------------------
     The two track cards: small books in the same language as the hero
     book, each telling one story with our own orders marked in amber.
     Maker - our orders wait in the queue on both sides and are filled
     as others trade through it. Taker - our order arrives and takes the
     front of the queue, level after level.
     --------------------------------------------------------------- */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function fmtPx(p) { return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function clock() {
    var d = new Date();
    function p(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
    return p(d.getHours(), 2) + ':' + p(d.getMinutes(), 2) + ':' + p(d.getSeconds(), 2) + '.' + p(d.getMilliseconds(), 3);
  }

  /* three levels a side at fixed prices; index 0 is the best level */
  function MiniBook(root) {
    var self = this, seq = 0, TICK = 0.25, BASE = 5124;
    var asksEl = root.querySelector('.mbo-asks'), bidsEl = root.querySelector('.mbo-bids');
    var tapeEl = root.querySelector('.mbo-tape'), noteEl = root.querySelector('.mbo-note');
    this.asks = []; this.bids = []; this.tape = [];

    this.order = function (own, q) { return { id: ++seq, q: q || rnd(1, 9), own: own, fresh: true }; };
    this.topUp = function (lvl, n) { while (lvl.o.length < n) lvl.o.push(self.order(false)); };
    this.mark = function (id, cls) {
      var chip = root.querySelector('.chip[data-id="' + id + '"]');
      if (chip) chip.classList.add(cls);
    };
    this.print = function (cls, label, q, px) {
      self.tape.unshift({ cls: cls, label: label, q: q, px: px, time: clock(), fresh: true });
      if (self.tape.length > 2) self.tape.length = 2;
    };

    function row(l, maxTotal) {
      var tot = 0;
      var chips = l.o.map(function (o) {
        tot += o.q;
        var html = '<span class="chip' + (o.own ? ' own' : '') + (o.fresh ? ' is-new' : '') + '" data-id="' + o.id +
          '" style="--q:' + Math.min(o.q, 24) + '">' + o.q + '</span>';
        o.fresh = false;
        return html;
      }).join('');
      return '<div class="mbo-row" style="--depth:' + Math.round(100 * tot / maxTotal) + '%"><span class="px">' + fmtPx(l.px) +
        '</span><span class="q">' + chips + '</span><span class="tot">' + (tot || '') + '</span></div>';
    }
    this.draw = function (note) {
      var maxTotal = 1;
      self.asks.concat(self.bids).forEach(function (l) {
        maxTotal = Math.max(maxTotal, l.o.reduce(function (s, o) { return s + o.q; }, 0));
      });
      asksEl.innerHTML = self.asks.slice().reverse().map(function (l) { return row(l, maxTotal); }).join('');
      bidsEl.innerHTML = self.bids.map(function (l) { return row(l, maxTotal); }).join('');
      noteEl.innerHTML = note;
      tapeEl.innerHTML = self.tape.map(function (t) {
        var html = '<div class="tp ' + t.cls + (t.fresh ? ' is-new' : '') + '"><span>' + t.time + '</span><b>' + t.label +
          '</b><span>' + t.q + '</span><span>@ ' + fmtPx(t.px) + '</span></div>';
        t.fresh = false;
        return html;
      }).join('');
    };

    for (var i = 0; i < 3; i++) {
      this.asks.push({ px: BASE + TICK * (i + 1), o: [] });
      this.bids.push({ px: BASE - TICK * i, o: [] });
      this.topUp(this.asks[i], 3 + i);
      this.topUp(this.bids[i], 3 + i);
    }
    this.asks.concat(this.bids).forEach(function (l) { l.o.forEach(function (o) { o.fresh = false; }); });
  }

  /* run step() on a beat while the card is on screen; step may defer a change with later() */
  function runBook(root, step, draw, pace) {
    draw();
    if (reduceMotion || !('IntersectionObserver' in window)) return;   // a still book is fine

    var timer = null, onScreen = false, pending = false;
    function later(fn) {
      pending = true;
      setTimeout(function () { pending = false; fn(); draw(); }, 150);
    }
    function tick() {
      timer = null;
      if (!onScreen || document.hidden) return;
      step(later);
      if (!pending) draw();
      timer = setTimeout(tick, pace());
    }
    function start() { if (!timer) timer = setTimeout(tick, 500); }

    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start();
    }).observe(root);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && onScreen) start(); });
  }

  function initMaker() {
    var root = document.querySelector('[data-track="maker"]');
    if (!root) return;
    var book = new MiniBook(root), mine = { bid: null, ask: null };

    function best(side) { return side === 'bid' ? book.bids[0] : book.asks[0]; }
    function quote(side) {                       // our order always joins at the back, behind a real queue
      book.topUp(best(side), 3);
      mine[side] = book.order(true, rnd(2, 5));
      best(side).o.push(mine[side]);
    }
    function ahead(side) { return best(side).o.indexOf(mine[side]); }
    function draw() {
      book.draw('<span>Ahead of our bid<b>' + ahead('bid') + '</b></span><span>Ahead of our ask<b>' + ahead('ask') + '</b></span>');
    }

    function step(later) {
      var side = Math.random() < 0.5 ? 'bid' : 'ask', lvl = best(side), r = Math.random();

      if (r < 0.36) {                            // an aggressor trades with whoever is first in line
        var front = lvl.o[0];
        book.mark(front.id, 'is-hit');
        return later(function () {
          lvl.o.shift();
          if (front.own) { book.print('own', 'OURS', front.q, lvl.px); quote(side); }
          else book.print(side === 'bid' ? 'sell' : 'buy', side === 'bid' ? 'SELL' : 'BUY', front.q, lvl.px);
        });
      }
      if (r < 0.84) {                            // somebody joins behind us
        var deep = Math.random() < 0.3 ? (side === 'bid' ? book.bids : book.asks)[rnd(1, 2)] : lvl;
        if (deep.o.length < 7) deep.o.push(book.order(false));
        return;
      }
      var n = ahead(side);                       // somebody ahead of us cancels: we move up
      if (n > 0) {
        var gone = lvl.o[rnd(0, n - 1)];
        book.mark(gone.id, 'is-out');
        later(function () { lvl.o.splice(lvl.o.indexOf(gone), 1); });
      }
    }

    quote('bid'); quote('ask');
    mine.bid.fresh = mine.ask.fresh = false;
    runBook(root, step, draw, function () { return rnd(420, 820); });
  }

  function initTaker() {
    var root = document.querySelector('[data-track="taker"]');
    if (!root) return;
    var book = new MiniBook(root);
    var phase = 'wait', beats = 3, buy = true, size = 0, left = 0, cost = 0;

    function draw() {
      var note;
      if (phase === 'sweep') {
        note = '<span>Our order<b class="own">' + (buy ? 'BUY ' : 'SELL ') + size + '</b></span><span>Filled<b>' + (size - left) +
          '</b></span><span>Left<b>' + left + '</b></span>';
      } else if (phase === 'rest') {
        note = '<span>Filled<b class="own">' + size + '</b></span><span>Avg price<b>' + fmtPx(cost / size) + '</b></span>';
      } else {
        note = '<span>Waiting for a signal</span>';
      }
      book.draw(note);
    }

    function step(later) {
      var side = buy ? book.asks : book.bids, i;

      if (phase === 'wait') {
        if (--beats > 0) return;
        size = left = rnd(14, 26); cost = 0; phase = 'sweep';
        return;
      }

      if (phase === 'sweep') {                   // take the front order of the nearest level that still has any
        var lvl = null;
        for (i = 0; i < side.length && !lvl; i++) if (side[i].o.length) lvl = side[i];
        if (!lvl) { size -= left; left = 0; }    // the book is empty: we got what there was
        if (left <= 0) { phase = 'rest'; beats = 4; return; }
        var front = lvl.o[0], take = Math.min(front.q, left);
        book.mark(front.id, 'is-hit');
        return later(function () {
          front.q -= take; left -= take; cost += take * lvl.px;
          if (!front.q) lvl.o.shift();
          book.print('own', buy ? 'BUY' : 'SELL', take, lvl.px);
          if (left <= 0) { phase = 'rest'; beats = 4; }
        });
      }

      for (i = 0; i < side.length; i++) if (side[i].o.length < 3 + i) side[i].o.push(book.order(false));   // liquidity returns
      if (--beats > 0) return;
      buy = !buy; phase = 'wait'; beats = 3;
    }

    runBook(root, step, draw, function () { return phase === 'sweep' ? rnd(260, 380) : rnd(480, 760); });
  }

  /* ---------------------------------------------------------------
     Case-study screenshots: tabs switch the view, it advances by itself
     until someone takes over, the frame leans toward the cursor, and a
     click opens the full-size image.
     --------------------------------------------------------------- */
  function initShots() {
    var box = document.querySelector('[data-shots]');
    if (!box) return;

    var each = Array.prototype.slice;
    var tabs = each.call(box.querySelectorAll('[role="tab"]'));
    var imgs = each.call(box.querySelectorAll('.shot-stage img'));
    var caps = each.call(box.querySelectorAll('.shot-cap'));
    var frame = box.querySelector('.shot-frame');
    var stage = box.querySelector('.shot-stage');
    var name = box.querySelector('.shot-name');
    var current = 0, auto = !reduceMotion, onScreen = false, timer = null;

    function show(i) {
      current = i;
      tabs.forEach(function (tab, k) {
        tab.setAttribute('aria-selected', k === i ? 'true' : 'false');
        tab.tabIndex = k === i ? 0 : -1;
      });
      imgs.forEach(function (img, k) { img.classList.toggle('is-on', k === i); });
      caps.forEach(function (cap, k) { cap.classList.toggle('is-on', k === i); });
      name.textContent = tabs[i].getAttribute('data-name');
    }
    function schedule() {
      clearTimeout(timer);
      var running = auto && onScreen && !document.hidden;
      box.classList.toggle('is-auto', running);
      if (running) timer = setTimeout(function () { show((current + 1) % tabs.length); schedule(); }, 6000);
    }
    function takeOver(i) { auto = false; show(i); schedule(); }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { takeOver(i); });
      tab.addEventListener('keydown', function (e) {
        var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        if (html.dir === 'rtl') step = -step;
        var to = (i + step + tabs.length) % tabs.length;
        takeOver(to);
        tabs[to].focus();
      });
    });

    function enlarge() {
      auto = false; schedule();
      var layer = document.createElement('div');
      layer.className = 'lightbox';
      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-modal', 'true');
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'lightbox-close';
      close.setAttribute('aria-label', html.lang === 'fa' ? 'بستن' : 'Close');
      close.textContent = '×';
      var big = document.createElement('img');
      big.src = imgs[current].getAttribute('data-full');
      big.alt = imgs[current].alt;
      layer.appendChild(close);
      layer.appendChild(big);
      document.body.appendChild(layer);
      document.body.style.overflow = 'hidden';

      function shut() {
        layer.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
        stage.focus();
      }
      function onKey(e) { if (e.key === 'Escape') shut(); }
      layer.addEventListener('click', shut);
      document.addEventListener('keydown', onKey);
      close.focus();
    }
    stage.tabIndex = 0;
    stage.addEventListener('click', enlarge);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enlarge(); }
    });
    box.querySelector('.shot-zoom').addEventListener('click', enlarge);

    if (!reduceMotion && !window.matchMedia('(hover: none)').matches) {   // lean toward the cursor
      frame.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        frame.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 5).toFixed(2) + 'deg');
        frame.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 4).toFixed(2) + 'deg');
      });
      frame.addEventListener('pointerleave', function () {
        frame.style.setProperty('--rx', '0deg');
        frame.style.setProperty('--ry', '0deg');
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.35 }).observe(box);
      document.addEventListener('visibilitychange', schedule);
    }
  }

  /* ---------------------------------------------------------------
     Samsung Internet's dark mode paints every link's text yellow, whatever
     colour the page asks for, and offers no opt-out. An anchor with no href
     is not a link to it, so there the address moves to data-href and the
     navigation is done here. Other browsers keep ordinary links.
     --------------------------------------------------------------- */
  function initSamsung() {
    if (!/SamsungBrowser/i.test(navigator.userAgent)) return;
    Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
      var raw = a.getAttribute('href'), url = a.href;
      var blank = a.target === '_blank', dl = a.hasAttribute('download');
      a.setAttribute('data-href', raw);
      a.removeAttribute('href');
      a.setAttribute('role', 'link');
      a.tabIndex = 0;

      function go(e) {
        e.preventDefault();
        if (raw.charAt(0) === '#') {
          var el = document.getElementById(raw.slice(1));
          if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
          return;
        }
        if (blank || dl) {                       // let a real, unrendered link do it
          var t = document.createElement('a');
          t.href = url;
          if (blank) { t.target = '_blank'; t.rel = 'noopener'; }
          if (dl) t.setAttribute('download', '');
          t.click();
          return;
        }
        window.location.href = url;
      }
      a.addEventListener('click', go);
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(e); });
    });
  }

  /* ---------------------------------------------------------------
     Headline figures count up from zero the first time they are seen.
     The figure keeps its own digits (Persian or Latin), separators and
     decimals; years and dates are left alone.
     --------------------------------------------------------------- */
  function initCount() {
    if (reduceMotion || returning || !('IntersectionObserver' in window)) return;
    var FA = '۰۱۲۳۴۵۶۷۸۹';
    var NUM = /[0-9۰-۹]+(?:[,٬][0-9۰-۹]{3})*(?:[.٫][0-9۰-۹]+)?/g;
    function value(s) {
      return parseFloat(s.replace(/[٬,]/g, '').replace('٫', '.').replace(/[۰-۹]/g, function (c) { return FA.indexOf(c); }));
    }
    function write(v, like) {
      var decimals = (like.split(/[.٫]/)[1] || '').length, parts = v.toFixed(decimals).split('.');
      if (/[,٬]/.test(like)) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      var s = parts.join('.');
      if (/[۰-۹]/.test(like)) s = s.replace(/,/g, '٬').replace('.', '٫').replace(/\d/g, function (d) { return FA.charAt(d); });
      return s;
    }
    var jobs = [];
    Array.prototype.forEach.call(document.querySelectorAll('.facts-glass b, .proj-facts b, .report-facts b'), function (el) {
      var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node, mine = [];
      while ((node = walk.nextNode())) {
        var found = node.nodeValue.match(NUM);
        if (!found) continue;
        var dated = found.some(function (m) { var v = value(m); return !/[,٬.٫]/.test(m) && v >= 1300 && v <= 2100; });
        if (!dated) mine.push({ node: node, text: node.nodeValue });
      }
      if (mine.length) jobs.push({ el: el, parts: mine });
    });
    if (!jobs.length) return;

    function run(job) {
      var t0 = null, span = 1100;
      function frame(now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / span), k = 1 - Math.pow(1 - p, 3);
        job.parts.forEach(function (part) {
          part.node.nodeValue = p === 1 ? part.text : part.text.replace(NUM, function (m) { return write(value(m) * k, m); });
        });
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        seen.unobserve(entry.target);
        jobs.forEach(function (job) { if (job.el === entry.target) run(job); });
      });
    }, { threshold: 0.6 });
    jobs.forEach(function (job) { seen.observe(job.el); });
  }

  function boot() {
    initLang();
    initNav();
    initReveal();
    initToc();
    initCount();
    initGlow();
    initMbo();
    initMaker();
    initTaker();
    initShots();
    initSamsung();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
