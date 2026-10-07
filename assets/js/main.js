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
      if (window.scrollY <= 60 || i === list.length) i = -1;      // at the top: there is no place to find again
      try { sessionStorage.setItem(KEY, JSON.stringify({ to: to, i: i, f: i < 0 ? 0 : (top - r.top) / r.height })); } catch (err) { /* no place kept */ }
      if (!kept) {                  // nothing can be remembered in this browser: carry the choice in the address
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = dest + '?lang=' + to;
      }
    });

    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch (err) { /* none */ }
    if (!saved || saved.to !== html.lang) { html.classList.remove('is-returning'); return; }
    returning = true;
    html.classList.add('is-returning');
    setTimeout(function () { html.classList.remove('is-returning'); }, 400);
    var mark = blocks()[saved.i], last = -1;
    if (!mark) return;
    function settle() {
      var r = mark.getBoundingClientRect();
      last = Math.max(0, Math.round(window.scrollY + r.top + saved.f * r.height - line()));
      window.scrollTo({ top: last, behavior: 'instant' });
    }
    settle();
    // the web font may land a moment later and move the lines: settle once more, unless the reader has moved on
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (Math.abs(window.scrollY - last) < 4) settle(); });
    }
  }

  /* A project's name travels from its card to the heading of its page. The card's title takes the shared
     name only when that card is clicked, so the other cards simply fade with the page. Going back with
     the browser's button, the heading returns to the same card. */
  function initCards() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('a.proj, a.projnav-card'));
    cards.forEach(function (card) {
      var m = /projects\/([\w-]+)\.html/.exec(card.getAttribute('href') || '');
      if (!m) return;
      card.addEventListener('click', function () {
        cards.forEach(function (c) { var t = c.querySelector('h3 > span'); if (t) t.style.viewTransitionName = ''; });
        var title = card.querySelector('h3 > span');
        if (title) title.style.viewTransitionName = 'proj-title';
        try { sessionStorage.setItem('nova-card', m[1]); } catch (e) { /* the heading just rises as usual */ }
      });
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

  /* Home: the three layers of the method land on one another, from the bottom up, when the stack is in view */
  function initStack() {
    var stack = document.querySelector('.layers-home');
    if (!stack) return;
    if (reduceMotion || returning || !('IntersectionObserver' in window)) { stack.classList.add('is-stacked', 'is-settled'); return; }
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      seen.disconnect();
      stack.classList.add('is-stacked');
      setTimeout(function () { stack.classList.add('is-settled'); }, 1800);   // from here on a hover answers at once
    }, { threshold: 0.6 });
    seen.observe(stack);
  }

  /* Home, behind the closing line. Marks drift in scattered from the side the sentence starts on and
     gather into a few steady streams by the time they leave: order flow on one side, capital flow on the other. */
  function initFlow() {
    var canvas = document.querySelector('.band-slogan .flow');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d'), rtl = html.dir === 'rtl';
    var LANES = [0.07, 0.13, 0.19, 0.87, 0.93];      // above and below the words, never across them
    var W = 0, H = 0, dpr = 1, marks = [], raf = 0, onScreen = false, then = 0;

    function mark(x) {
      return {
        x: x, y: 0.05 + Math.random() * 0.9, lane: LANES[Math.floor(Math.random() * LANES.length)],
        v: 0.04 + Math.random() * 0.055, len: 5 + Math.random() * 16, w: Math.random() < 0.22 ? 2.2 : 1.3,
        beat: 0.7 + Math.random() * 1.7, at: Math.random() * 6.283
      };
    }
    function size() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return;   // a phone's address bar sliding away is not a new size
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      marks = [];
      for (var n = Math.round(Math.min(96, Math.max(36, W / 12))), i = 0; i < n; i++) marks.push(mark(Math.random()));
    }
    function draw(now) {
      var dt = Math.min(0.05, (now - then) / 1000) || 0, i, m, k, y, x, len, edge;
      then = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (i = 0; i < marks.length; i++) {
        m = marks[i];
        m.x += m.v * dt;
        if (m.x > 1.06) m = marks[i] = mark(-0.06);
        k = Math.min(1, Math.max(0, (m.x - 0.1) / 0.6));
        k = k * k * (3 - 2 * k);                      // 0 while scattered, 1 once in a stream
        y = (m.y + (m.lane - m.y) * k) * H + (1 - k) * Math.sin(now / 1000 * m.beat + m.at) * 8;
        x = (rtl ? 1 - m.x : m.x) * W;
        len = m.len * (0.5 + 1.5 * k) * (rtl ? -1 : 1);
        edge = Math.max(0, Math.min(1, (m.x + 0.06) / 0.14, (1.06 - m.x) / 0.16));
        ctx.strokeStyle = 'rgba(' + Math.round(91 - 35 * k) + ',' + Math.round(155 + 58 * k) + ',' + Math.round(255 - 10 * k) + ',' +
          (edge * (0.32 + 0.4 * k)).toFixed(3) + ')';   // blue while scattered, cyan once gathered
        ctx.lineWidth = m.w;
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    function loop(now) {
      raf = 0;
      if (!onScreen || document.hidden) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && onScreen && !document.hidden) { then = performance.now(); raf = requestAnimationFrame(loop); } }

    size();
    draw(performance.now());
    window.addEventListener('resize', function () { size(); draw(performance.now()); });
    if (reduceMotion || !('IntersectionObserver' in window)) return;      // one still frame is enough
    new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);
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

     The visitor can trade in it through the ticket under the book: a market
     or a limit order of a chosen size, sent at once or after a delay. A
     market order takes the front of the queue. A limit order that cannot
     trade at once waits in the queue, in amber, and is filled in its turn
     like any other. The ticket reports the average price, how far the
     price moved, the slippage, and the position that results.
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
    var warming = true, pending = false, busy = false;
    var mine = [];                  // the visitor's orders waiting in the book
    var drawTicket = function () {};

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
        var html = '<span class="chip' + (o.own ? ' own' : '') + (o.fresh ? ' is-new' : '') + '" data-id="' + o.id + '" style="--q:' + Math.min(o.q, 24) + '">' + o.q + '</span>';
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
        var html = '<div class="tp ' + (t.own ? 'own' : t.buy ? 'buy' : 'sell') + (t.fresh ? ' is-new' : '') + '"><span>' + t.time + '</span>' +
          '<b>' + (t.own ? 'YOU' : t.buy ? 'BUY' : 'SELL') + '</b><span>' + t.q + '</span><span>@ ' + fmt(t.px) + '</span></div>';
        t.fresh = false;
        return html;
      }).join('');
      drawSpark();
      drawTicket();
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
    function print(buy, q, px, own) {
      if (last !== null && px !== last) lastDir = px > last ? 1 : -1;
      last = px;
      tape.unshift({ time: stamp(), buy: buy, q: q, px: px, own: !!own, fresh: !warming });
      if (tape.length > 3) tape.length = 3;
    }

    /* A level that leaves the visible book takes a waiting order of the visitor's out of sight. The order
       is kept, and joins the end of the queue again when the book comes back to its price. */
    function drop(book) {
      book.pop().o.forEach(function (o) { if (o.own) o.w.away = true; });
    }
    function bringBack(book) {
      mine.forEach(function (w) {
        if (!w.away || (w.buy ? bids : asks) !== book) return;
        for (var i = 0; i < book.length; i++) {
          if (book[i].px === w.px) { book[i].o.push(w.chip); w.away = false; return; }
        }
      });
    }
    /* someone quotes inside the spread: a new best level on that side */
    function improve(book, dir) {
      book.unshift({ px: book[0].px + dir * TICK, o: [order()] });
      drop(book);
    }
    /* the best level is gone: the next one becomes best, and a far level appears */
    function shift(book, dir) {
      book.shift();
      book.push(level(book[book.length - 1].px + dir * TICK, rnd(3, 7)));
      bringBack(book);
    }
    /* a level somewhere in the book has been emptied by a cancel: close the row up */
    function closeUp(book, i) {
      var dir = book === asks ? 1 : -1;
      if (i === 0) return shift(book, dir);
      book.splice(i, 1);
      book.push(level(book[book.length - 1].px + dir * TICK, rnd(3, 7)));
      bringBack(book);
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
        if (gone.own) return;                            // only the visitor cancels the visitor's order
        mark([gone.id], 'is-out');
        return commit(function () {
          var at = from.o.indexOf(gone);
          if (at > -1) from.o.splice(at, 1);
        });
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
            if (front.own) front.w.hit(take, lv.px);     // the visitor's waiting order has its turn
          }
          if (lv.o.length) break;
          shift(hitBook, buy ? 1 : -1);
          swept++;
        }
        if (done) print(buy, done, px);
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

    /* ---------------------------------------------------------------
       The ticket: the visitor's own orders.
       --------------------------------------------------------------- */
    var desk = document.querySelector('.mbo-try');
    if (desk) (function () {
      var say = desk.querySelector('.mbo-say'), statsEl = desk.querySelector('.tk-stats'), workEl = desk.querySelector('.tk-work');
      var posEl = desk.querySelector('.tk-pos'), posText = desk.querySelector('.tk-pos-text');
      var sizeEl = desk.querySelector('.tk-size'), pxEl = desk.querySelector('.tk-px');
      var buttons = Array.prototype.slice.call(desk.querySelectorAll('.mbo-btn'));
      var notes = { buy: desk.querySelector('.mbo-btn.is-buy small'), sell: desk.querySelector('.mbo-btn.is-sell small') };
      var cells = {};
      Array.prototype.forEach.call(desk.querySelectorAll('[data-s]'), function (n) { cells[n.getAttribute('data-s')] = n; });
      var want = { limit: false, size: 10, px: bids[0].px, wait: 0 }, flying = false;
      var pos = 0, cost = 0, banked = 0, traded = false;   // the position, what it cost, and results already closed
      var LADDER = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 99], DIGITS = '۰۱۲۳۴۵۶۷۸۹', shown = {};

      /* figures in the page's own digits */
      function local(text) {
        return fa ? text.replace(/,/g, '٬').replace(/\./g, '٫').replace(/\d/g, function (d) { return DIGITS.charAt(d); }) : text;
      }
      function num(v, decimals) { return local(decimals ? v.toFixed(decimals) : String(v)); }
      function b(text) { return '<bdi>' + text + '</bdi>'; }
      function cash(p) { return b(local(fmt(p))); }
      function signed(v, decimals) {
        return '<bdi dir="ltr">' + (v > 0.00001 ? '+' : v < -0.00001 ? '−' : '') + num(Math.abs(v), decimals) + '</bdi>';
      }
      function put(el, key, text) { if (shown[key] !== text) { shown[key] = text; el.textContent = text; } }

      var T = fa ? {
        buy: 'خرید', sell: 'فروش', market: 'به قیمت بازار', now: 'فوراً پر می‌شود', queue: 'در صف می‌نشیند', best: 'بهترین قیمت',
        flying: 'سفارش در راه است…', cancelled: 'سفارش لغو شد.', noRoom: 'حداکثر سه سفارش هم‌زمان در صف می‌ماند؛ اول یکی را لغو کنید.',
        self: ' سفارش منتظرِ خودتان در طرف مقابل اول لغو شد تا با خودتان معامله نکنید.',
        waits: { 500: 'نیم‌ثانیه', 2000: 'دو ثانیه' },
        late: function (w) { return ' سفارش ' + T.waits[w] + ' پس از ارسال به بازار رسید.'; },
        swept: function (o, moved) {
          return o.levels ? ' ' + b(num(o.levels)) + ' سطح قیمت خالی شد و قیمت ' + b(num(moved, 2)) + (o.buy ? ' بالا رفت.' : ' پایین آمد.')
                          : ' صف کوتاه‌تر شد، ولی قیمت جابه‌جا نشد.';
        },
        filled: function (o, side, avg, moved) {
          return 'سفارش ' + (o.limit ? 'محدودِ ' : '') + side + ' شما ' + (o.limit ? 'فوراً ' : '') + 'پر شد: ' + b(num(o.got)) +
            ' قرارداد با میانگین قیمت ' + avg + '.' + T.swept(o, moved);
        },
        part: function (o, side, avg) {
          return 'از سفارش محدودِ ' + side + ' شما ' + b(num(o.got)) + ' قرارداد فوراً با میانگین قیمت ' + avg + ' پر شد و ' +
            b(num(o.rested)) + ' قرارداد باقی‌مانده در قیمت ' + cash(o.px) + ' در صف نشست.';
        },
        rests: function (o, side, ahead) {
          var head = 'سفارش محدودِ ' + side + ' شما برای ' + b(num(o.rested)) + ' قرارداد در قیمت ' + cash(o.px);
          if (ahead === null) return head + ' ثبت شد؛ این قیمت بیرون از عمق نمایش است.';
          return head + (ahead ? ' در صف نشست؛ ' + b(num(ahead)) + ' قرارداد جلوتر از آن است.' : ' در صف نشست و اولِ صف است.');
        },
        hitPart: function (w, q, px) {
          return b(num(q)) + ' قرارداد از سفارش ' + (w.buy ? T.buy : T.sell) + ' در صفِ شما در قیمت ' + cash(px) + ' معامله شد؛ ' +
            b(num(w.chip.q)) + ' قرارداد هنوز منتظر است.';
        },
        hitAll: function (w, px) {
          return 'سفارش ' + (w.buy ? T.buy : T.sell) + ' در صفِ شما کامل پر شد: ' + b(num(w.size)) + ' قرارداد در قیمت ' + cash(px) + '.';
        },
        row: function (w) { return num(w.chip.q) + ' در ' + local(fmt(w.px)); },
        ahead: function (n) { return n === null ? 'بیرون از عمق نمایش' : 'جلوتر: ' + num(n); },
        done: function (w) { return 'پرشده: ' + num(w.filled) + ' از ' + num(w.size); },
        cancel: 'لغو این سفارش',
        position: function (p, avg, pnl) {
          return 'موقعیت: ' + (p ? signed(p) + ' قرارداد با میانگین ' + avg : 'بدون موقعیت باز') + ' · سود و زیان به واحد قیمت: ' + pnl;
        }
      } : {
        buy: 'buy', sell: 'sell', market: 'at market', now: 'fills at once', queue: 'joins the queue', best: 'best price',
        lots: function (n) { return b(num(n)) + (n === 1 ? ' contract' : ' contracts'); },
        flying: 'Order on its way…', cancelled: 'Order cancelled.', noRoom: 'Up to three orders can wait at a time; cancel one first.',
        self: ' Your own waiting order on the other side was cancelled first, so that you would not trade with yourself.',
        waits: { 500: '0.5 s', 2000: '2 s' },
        late: function (w) { return ' It reached the market ' + T.waits[w] + ' after you sent it.'; },
        swept: function (o, moved) {
          return o.levels ? ' ' + b(num(o.levels)) + ' price level' + (o.levels > 1 ? 's' : '') + ' emptied and the price moved ' +
                            (o.buy ? 'up ' : 'down ') + b(num(moved, 2)) + '.'
                          : ' The queue got shorter, but the price did not move.';
        },
        filled: function (o, side, avg, moved) {
          return 'Your ' + side + (o.limit ? ' limit' : ' order') + ' was filled' + (o.limit ? ' at once' : '') + ': ' + T.lots(o.got) +
            ' at an average price of ' + avg + '.' + T.swept(o, moved);
        },
        part: function (o, side, avg) {
          return T.lots(o.got) + ' of your ' + side + ' limit ' + (o.got === 1 ? 'was' : 'were') + ' filled at once at an average price of ' +
            avg + '; the other ' + b(num(o.rested)) + ' joined the queue at ' + cash(o.px) + '.';
        },
        rests: function (o, side, ahead) {
          var head = 'Your ' + side + ' limit for ' + T.lots(o.rested) + ' ';
          if (ahead === null) return head + 'at ' + cash(o.px) + ' is placed; that price is outside the visible book.';
          return head + 'joined the queue at ' + cash(o.px) +
            (ahead ? '; ' + T.lots(ahead) + (ahead === 1 ? ' is' : ' are') + ' ahead of it.' : ' and is first in line.');
        },
        hitPart: function (w, q, px) {
          return T.lots(q) + ' of your waiting ' + (w.buy ? T.buy : T.sell) + ' order traded at ' + cash(px) + '; ' +
            b(num(w.chip.q)) + (w.chip.q === 1 ? ' is' : ' are') + ' still waiting.';
        },
        hitAll: function (w, px) {
          return 'Your waiting ' + (w.buy ? T.buy : T.sell) + ' order is filled in full: ' + T.lots(w.size) + ' at ' + cash(px) + '.';
        },
        row: function (w) { return w.chip.q + ' at ' + fmt(w.px); },
        ahead: function (n) { return n === null ? 'outside the visible book' : 'ahead: ' + n; },
        done: function (w) { return 'filled: ' + w.filled + ' of ' + w.size; },
        cancel: 'Cancel this order',
        position: function (p, avg, pnl) {
          return 'Position: ' + (p ? signed(p) + (Math.abs(p) === 1 ? ' contract' : ' contracts') + ' at an average of ' + avg : 'flat') +
            ' · P&L in price points: ' + pnl;
        }
      };

      function tell(html, onWay) {
        say.innerHTML = html;
        say.classList.toggle('is-flying', !!onWay);
        say.classList.remove('is-told');
        void say.offsetWidth;                 // restart the entrance of the sentence
        say.classList.add('is-told');
      }
      function stat(got, size, avg, moved, slip) {
        cells.filled.textContent = num(got) + ' / ' + num(size);
        cells.avg.textContent = avg === null ? '—' : local(fmt(avg));
        cells.moved.innerHTML = moved === null ? '—' : signed(moved, 2);
        cells.slip.innerHTML = slip === null ? '—' : signed(slip, 2);
        statsEl.hidden = false;
      }

      /* the position: what is held, at what average, and what has been closed */
      function trade(buy, q, px) {
        var s = buy ? q : -q;
        traded = true;
        if (pos === 0 || (pos > 0) === (s > 0)) { cost += s * px; pos += s; return; }
        var avg = cost / pos, closing = Math.min(Math.abs(pos), q);
        banked += closing * (px - avg) * (pos > 0 ? 1 : -1);
        pos += s;
        cost = pos === 0 ? 0 : ((pos > 0) === (s > 0) ? pos * px : pos * avg);   // gone through flat: the rest opens at this price
      }

      /* how many contracts must trade before a waiting order's turn comes */
      function ahead(w) {
        if (w.away) return null;
        var book = w.buy ? bids : asks, n = 0, i, j;
        for (i = 0; i < book.length; i++) {
          for (j = 0; j < book[i].o.length; j++) {
            if (book[i].o[j] === w.chip) return n;
            n += book[i].o[j].q;
          }
        }
        return null;
      }
      function forget(w) {
        var at = mine.indexOf(w);
        if (at > -1) mine.splice(at, 1);
        if (w.row.parentNode) w.row.parentNode.removeChild(w.row);
        workEl.hidden = !mine.length;
      }
      function cancel(w) {
        var book = w.buy ? bids : asks, i, at;
        for (i = 0; i < book.length; i++) {
          at = book[i].o.indexOf(w.chip);
          if (at > -1) { book[i].o.splice(at, 1); if (!book[i].o.length) closeUp(book, i); break; }
        }
        forget(w);
      }
      function wait(o) {                        // what could not trade at once joins the queue at its price
        if (mine.length >= 3) { o.refused = true; return; }
        var book = o.buy ? bids : asks, w = { buy: o.buy, px: o.px, size: o.left, filled: 0, away: false }, i;
        w.chip = { id: ++seq, q: o.left, own: true, w: w, fresh: true };
        w.hit = function (q, px) {              // an aggressor reaches it
          w.filled += q;
          trade(w.buy, q, px);
          print(w.buy, q, px, true);
          if (w.chip.q) tell(T.hitPart(w, q, px));
          else { forget(w); tell(T.hitAll(w, px)); }
          stat(w.filled, w.size, px, null, 0);
        };
        for (i = 0; i < book.length; i++) {
          if (book[i].px === o.px) { book[i].o.push(w.chip); break; }
          if (o.buy ? book[i].px < o.px : book[i].px > o.px) { book.splice(i, 0, { px: o.px, o: [w.chip] }); drop(book); break; }
        }
        if (i === book.length) w.away = true;   // beyond the last level on show: it waits out of sight
        w.row = document.createElement('li');
        w.row.innerHTML = '<b class="' + (w.buy ? 'is-buy' : 'is-sell') + '">' + (w.buy ? T.buy : T.sell) + '</b><span class="tk-what"></span>' +
          '<span class="tk-ahead"></span><span class="tk-done"></span><button type="button" aria-label="' + T.cancel + '">×</button>';
        w.row.querySelector('button').addEventListener('click', function () { cancel(w); tell(T.cancelled); frame(); });
        w.cells = [w.row.querySelector('.tk-what'), w.row.querySelector('.tk-ahead'), w.row.querySelector('.tk-done')];
        workEl.appendChild(w.row);
        workEl.hidden = false;
        mine.push(w);
        o.rested = o.left;
        o.w = w;
      }

      /* the part of an order that can trade at once: it takes the front of the other side, order by order,
         for as long as its size and its limit (if it has one) allow */
      function work(o, done) {
        var book = o.buy ? asks : bids, dir = o.buy ? 1 : -1, here = 0, at = 0;
        function allowed() { return o.px === null || (o.buy ? book[0].px <= o.px : book[0].px >= o.px); }
        (function next() {
          if (o.left <= 0 || o.levels >= 40 || !allowed()) {
            if (here) print(o.buy, here, at, true);
            return done();
          }
          var lv = book[0], front = lv.o[0];
          if (front.own) { cancel(front.w); o.self = true; return next(); }     // never against the visitor's own waiting order
          var q = Math.min(front.q, o.left), chip = root.querySelector('.chip[data-id="' + front.id + '"]');
          if (chip) chip.classList.add('is-mine');
          setTimeout(function () {
            front.q -= q; o.left -= q; o.got += q; o.paid += q * lv.px; here += q; at = lv.px;
            if (!front.q) lv.o.shift();
            if (!lv.o.length) { print(o.buy, here, lv.px, true); here = 0; shift(book, dir); o.levels++; }
            frame();
            next();
          }, reduceMotion ? 0 : 90);
        })();
      }

      function lock(on) { buttons.forEach(function (btn) { btn.disabled = on; }); }
      function readSize() {
        var v = parseInt(sizeEl.value.replace(/[۰-۹]/g, function (d) { return DIGITS.indexOf(d); })
          .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/\D/g, ''), 10);
        want.size = Math.max(1, Math.min(99, v || 1));
        sizeEl.value = num(want.size);
      }
      function arrive(o) {
        busy = true;                            // the visitor's order has the book to itself while it is worked
        if (pending) { setTimeout(function () { arrive(o); }, 40); return; }    // let the change in hand finish first
        o.from = (o.buy ? asks : bids)[0].px;
        work(o, function () {
          var side = o.buy ? T.buy : T.sell, avg = o.got ? o.paid / o.got : null;
          var moved = o.levels ? (o.buy ? asks : bids)[0].px - o.from : 0, text;
          if (o.got) trade(o.buy, o.got, avg);
          if (o.limit && o.left > 0) wait(o);
          if (o.refused) text = (o.got ? T.filled(o, side, cash(avg), Math.abs(moved)) + ' ' : '') + T.noRoom;
          else if (o.rested) text = o.got ? T.part(o, side, cash(avg)) : T.rests(o, side, ahead(o.w));
          else text = T.filled(o, side, cash(avg), Math.abs(moved));
          if (o.self) text += T.self;
          if (o.wait) text += T.late(o.wait);
          bias = o.buy ? 0.4 : -0.4;            // for a moment the flow leans a little the way the order pushed it
          biasLeft = 8;
          frame();
          tell(text);
          stat(o.got, o.size, avg, o.got ? moved : null, o.got ? (avg - o.seen) * (o.buy ? 1 : -1) : null);
          busy = false;
          flying = false;
          lock(false);
        });
      }
      function send(buy) {
        if (flying) return;
        readSize();
        var o = { buy: buy, limit: want.limit, px: want.limit ? want.px : null, size: want.size, left: want.size, wait: want.wait,
                  got: 0, paid: 0, levels: 0, rested: 0, self: false, refused: false, seen: (buy ? asks : bids)[0].px, from: 0, w: null };
        flying = true;
        lock(true);
        if (o.wait) {
          say.style.setProperty('--wait', o.wait + 'ms');
          tell(T.flying, true);
          setTimeout(function () { arrive(o); }, o.wait);
        } else arrive(o);
      }

      /* what the ticket shows moves with the book: what each button would do, each waiting order's place, the result so far */
      drawTicket = function () {
        put(notes.buy, 'nb', want.limit ? (want.px >= asks[0].px ? T.now : T.queue) : T.market);
        put(notes.sell, 'ns', want.limit ? (want.px <= bids[0].px ? T.now : T.queue) : T.market);
        put(pxEl, 'px', want.limit ? local(fmt(want.px)) : T.best);
        mine.forEach(function (w, i) {
          var id = 'w' + w.chip.id;
          put(w.cells[0], id + 'a', T.row(w));
          put(w.cells[1], id + 'b', T.ahead(ahead(w)));
          put(w.cells[2], id + 'c', T.done(w));
        });
        if (traded) {
          var html = T.position(pos, pos ? cash(cost / pos) : '', signed(banked + (pos ? (mid() - cost / pos) * pos : 0), 2));
          if (shown.pos !== html) { shown.pos = html; posText.innerHTML = html; }
          posEl.hidden = false;
        }
      };

      /* the controls */
      Array.prototype.forEach.call(desk.querySelectorAll('.tk-seg'), function (seg) {
        var kind = seg.getAttribute('data-k'), options = Array.prototype.slice.call(seg.querySelectorAll('button'));
        options.forEach(function (btn) {
          btn.addEventListener('click', function () {
            options.forEach(function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
            if (kind === 'type') {
              want.limit = btn.getAttribute('data-v') === 'limit';
              if (want.limit) want.px = bids[0].px;          // start at the best bid: a buy there joins the queue
              desk.classList.toggle('is-limit', want.limit);
            } else want.wait = parseInt(btn.getAttribute('data-v'), 10) || 0;
            drawTicket();
          });
        });
      });
      Array.prototype.forEach.call(desk.querySelectorAll('[data-step]'), function (btn) {
        btn.addEventListener('click', function () {
          var by = btn.getAttribute('data-step') === '1' ? 1 : -1, at;
          if (btn.getAttribute('data-of') === 'size') {
            readSize();
            for (at = 0; at < LADDER.length - 1 && LADDER[at] < want.size; at++) { /* the rung at or above the size */ }
            if (by < 0 && LADDER[at] >= want.size) at--;
            else if (by > 0 && LADDER[at] <= want.size) at++;
            want.size = LADDER[Math.max(0, Math.min(LADDER.length - 1, at))];
            sizeEl.value = num(want.size);
          } else if (want.limit) {
            want.px = Math.max(bids[0].px - 12 * TICK, Math.min(asks[0].px + 12 * TICK, want.px + by * TICK));
            drawTicket();
          }
        });
      });
      sizeEl.addEventListener('change', readSize);
      sizeEl.addEventListener('focus', function () { sizeEl.select(); });
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () { send(btn.getAttribute('data-side') === 'buy'); });
      });
      desk.querySelector('.tk-reset').addEventListener('click', function () {
        mine.slice().forEach(cancel);
        pos = cost = banked = 0;
        traded = false;
        posEl.hidden = statsEl.hidden = true;
        frame();
      });
      sizeEl.value = num(want.size);
    })();

    render();

    if (reduceMotion || !('IntersectionObserver' in window)) return;   // a still book is fine

    var timer = null, onScreen = false;
    function tick() {
      timer = null;
      if (!onScreen || document.hidden) return;
      if (busy) { timer = setTimeout(tick, 160); return; }       // the visitor's order has the book to itself
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

  /* The two books share one moment. When the taker's order sets off, it leaves its card, crosses to the
     other one and reaches the maker's waiting quote there: the same trade, seen from its two sides. */
  var maker = null;
  function cross(from, buy, size) {
    var side = buy ? 'ask' : 'bid', target = maker && maker.chip(side), start = from.querySelector('.mbo-note');
    if (!target || !start || reduceMotion || !document.body.animate || !window.CSS || !CSS.supports('offset-path', "path('M0 0L1 1')")) return;
    var a = start.getBoundingClientRect(), b = target.getBoundingClientRect(), vh = window.innerHeight;
    if (a.bottom < 60 || a.top > vh - 20 || b.bottom < 60 || b.top > vh - 20) return;     // both ends must be on screen
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    var lift = Math.min(90, 30 + Math.abs(x1 - x0) * 0.14 + Math.abs(y1 - y0) * 0.1);
    var dot = document.createElement('span');
    dot.className = 'cross-chip';
    dot.textContent = size;
    dot.style.offsetPath = "path('M" + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q' + ((x0 + x1) / 2).toFixed(1) + ' ' +
      (Math.min(y0, y1) - lift).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + "')";
    document.body.appendChild(dot);
    dot.animate([
      { offsetDistance: '0%', opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1.1, offset: 0.2 },
      { offsetDistance: '100%', opacity: 1, scale: 0.8 }
    ], { duration: 820, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' }).onfinish = function () {
      var ring = document.createElement('span');
      ring.className = 'cross-hit';
      ring.style.left = x1 + 'px';
      ring.style.top = y1 + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 520);
      dot.remove();
      maker.strike(side);
    };
  }
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
    /* something has just happened to this book: let it answer now rather than at its next beat */
    function hurry() {
      if (!onScreen || document.hidden) return;
      clearTimeout(timer);
      timer = setTimeout(tick, 60);
    }

    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start();
    }).observe(root);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && onScreen) start(); });
    return hurry;
  }

  function initMaker() {
    var root = document.querySelector('[data-track="maker"]');
    if (!root) return;
    var book = new MiniBook(root), mine = { bid: null, ask: null };
    var struck = null, hurry = null;             // the side the taker's order has just reached

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
      // once struck, the orders ahead of ours are taken one after another until ours has traded
      var side = struck || (Math.random() < 0.5 ? 'bid' : 'ask'), lvl = best(side), r = struck ? 0 : Math.random();

      if (r < 0.36) {                            // an aggressor trades with whoever is first in line
        var front = lvl.o[0];
        book.mark(front.id, 'is-hit');
        return later(function () {
          lvl.o.shift();
          if (front.own) { book.print('own', 'OURS', front.q, lvl.px); quote(side); struck = null; }
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
    hurry = runBook(root, step, draw, function () { return struck ? rnd(150, 230) : rnd(420, 820); });
    maker = {
      chip: function (side) { return mine[side] ? root.querySelector('.chip[data-id="' + mine[side].id + '"]') : null; },
      strike: function (side) { struck = side; if (hurry) hurry(); }
    };
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
        cross(root, buy, size);
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

    /* The view at full size. The wheel, two fingers or a double tap zoom in on the point under them, a drag
       moves the picture, and the arrows or a sideways swipe go to the next view. */
    function enlarge() {
      auto = false; schedule();
      function make(tag, cls, label) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (label) n.setAttribute('aria-label', label);
        if (tag === 'button') n.type = 'button';
        return n;
      }
      var layer = make('div', 'lightbox'), view = make('div', 'lightbox-view'), big = make('img');
      var close = make('button', 'lightbox-close', fa ? 'بستن' : 'Close');
      var prev = make('button', 'lightbox-nav is-prev', fa ? 'نمای قبلی' : 'Previous view');
      var next = make('button', 'lightbox-nav is-next', fa ? 'نمای بعدی' : 'Next view');
      var bar = make('div', 'lightbox-bar'), count = make('span', 'lightbox-count'), cap = make('span', 'lightbox-cap'), hint = make('span', 'lightbox-hint');
      var at = current, k = 1, x = 0, y = 0, ratio = 1, held = {}, fingers = 0, grab = null, moved = 0, lastTap = 0;
      var rest = each.call(document.body.children).filter(function (n) { return n.tagName !== 'SCRIPT'; });

      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-modal', 'true');
      close.textContent = '×';
      prev.innerHTML = next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
      hint.textContent = window.matchMedia('(pointer: coarse)').matches
        ? (fa ? 'بزرگ‌نمایی: دو انگشت یا دو ضربه' : 'Zoom: pinch or double tap')
        : (fa ? 'بزرگ‌نمایی: کلیک یا چرخ موس' : 'Zoom: click or wheel');
      if (tabs.length < 2) prev.hidden = next.hidden = true;
      bar.appendChild(count); bar.appendChild(cap); bar.appendChild(hint);
      view.appendChild(big);
      [close, prev, view, next, bar].forEach(function (n) { layer.appendChild(n); });

      function draw(eased) {
        big.classList.toggle('is-eased', !!eased);
        big.classList.toggle('is-zoomed', k > 1.01);
        big.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')';
      }
      function fit() {                       // the picture as large as the space allows, at its own proportions
        var w = Math.min(view.clientWidth, view.clientHeight * ratio);
        big.style.width = Math.floor(w) + 'px';
        big.style.height = Math.floor(w / ratio) + 'px';
      }
      function keepIn() {                    // never drag the picture off the screen
        var mx = Math.max(0, (big.offsetWidth * k - view.clientWidth) / 2 + (k > 1.01 ? 24 : 0));
        var my = Math.max(0, (big.offsetHeight * k - view.clientHeight) / 2 + (k > 1.01 ? 24 : 0));
        x = Math.max(-mx, Math.min(mx, x));
        y = Math.max(-my, Math.min(my, y));
      }
      function centre() { var r = view.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      function zoom(to, px, py, eased) {     // the point under the pointer stays under it
        to = Math.max(1, Math.min(5, to));
        var c = centre();
        x = (px - c.x) - (to / k) * (px - c.x - x);
        y = (py - c.y) - (to / k) * (py - c.y - y);
        k = to;
        if (k <= 1.01) { k = 1; x = 0; y = 0; }
        keepIn();
        draw(eased);
      }
      function load(i, fade) {
        var small = imgs[i], full = new Image(), want = small.getAttribute('data-full');
        at = i; k = 1; x = 0; y = 0;
        ratio = small.getAttribute('width') / small.getAttribute('height');
        fit();
        draw(false);
        big.alt = small.alt;
        big.src = small.currentSrc || small.src;                    // what is already on the page, at once ...
        full.onload = function () { if (at === i && layer.parentNode) big.src = want; };   // ... then the full-size file
        full.src = want;
        count.textContent = (i + 1) + ' / ' + tabs.length;
        cap.textContent = caps[i] ? caps[i].textContent.replace(/\s+/g, ' ').trim() : '';
        show(i);
        if (fade && !reduceMotion && big.animate) big.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      }
      function go(step) { load((at + step + tabs.length) % tabs.length, true); }
      function shut() {
        window.removeEventListener('resize', onResize);
        document.removeEventListener('keydown', onKey);
        rest.forEach(function (n) { n.inert = false; });
        document.body.style.overflow = '';
        layer.classList.add('is-closing');
        setTimeout(function () { layer.remove(); }, reduceMotion ? 0 : 200);
        stage.focus();
      }
      function onResize() { fit(); keepIn(); draw(false); }
      function onKey(e) {
        var forward = html.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight', back = html.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
        var c = centre();
        if (e.key === 'Escape') shut();
        else if (e.key === forward && tabs.length > 1) go(1);
        else if (e.key === back && tabs.length > 1) go(-1);
        else if (e.key === '+' || e.key === '=') zoom(k * 1.4, c.x, c.y, true);
        else if (e.key === '-') zoom(k / 1.4, c.x, c.y, true);
        else if (e.key === '0') zoom(1, c.x, c.y, true);
      }
      function two() {
        var ids = Object.keys(held), a = held[ids[0]], b = held[ids[1]];
        return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }

      big.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (big.setPointerCapture) big.setPointerCapture(e.pointerId);
        held[e.pointerId] = { x: e.clientX, y: e.clientY };
        fingers = Object.keys(held).length;
        if (fingers === 1) { grab = { px: e.clientX, py: e.clientY, x: x, y: y }; moved = 0; }
        else if (fingers === 2) { var p = two(); grab = { d: p.d, px: p.x, py: p.y, x: x, y: y, k: k }; moved = 99; }
        big.classList.add('is-held');
        big.classList.remove('is-eased');
      });
      big.addEventListener('pointermove', function (e) {
        if (!held[e.pointerId] || !grab) return;
        held[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (fingers === 2) {
          var p = two(), to = Math.max(1, Math.min(5, grab.k * p.d / grab.d)), c = centre();
          x = (p.x - c.x) - (to / grab.k) * (grab.px - c.x - grab.x);
          y = (p.y - c.y) - (to / grab.k) * (grab.py - c.y - grab.y);
          k = to;
          keepIn();
          draw(false);
        } else if (fingers === 1) {
          var dx = e.clientX - grab.px, dy = e.clientY - grab.py;
          moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
          if (k > 1.01) { x = grab.x + dx; y = grab.y + dy; keepIn(); }
          else if (e.pointerType !== 'mouse' && tabs.length > 1) x = dx * 0.6;       // a swipe starts to carry the picture
          draw(false);
        }
      });
      function release(e) {
        if (!held[e.pointerId]) return;
        var before = fingers, dx = grab ? e.clientX - grab.px : 0, dy = grab ? e.clientY - grab.py : 0, now = Date.now();
        delete held[e.pointerId];
        fingers = Object.keys(held).length;
        if (!fingers) big.classList.remove('is-held');
        if (before === 2) {                  // one finger stays down: it carries on as a drag
          if (fingers === 1) { var id = Object.keys(held)[0]; grab = { px: held[id].x, py: held[id].y, x: x, y: y }; }
          if (k <= 1.01) { var c = centre(); zoom(1, c.x, c.y, true); }
          return;
        }
        if (k <= 1.01) {
          var away = html.dir === 'rtl' ? dx : -dx;                 // towards the next view
          if (e.pointerType !== 'mouse' && tabs.length > 1 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) { go(away > 0 ? 1 : -1); return; }
          x = 0; y = 0;
          draw(true);
        }
        if (moved > 8 || e.type === 'pointercancel') return;        // that was a drag, not a tap
        if (e.pointerType === 'mouse') zoom(k > 1.01 ? 1 : 2.4, e.clientX, e.clientY, true);
        else if (now - lastTap < 330) { zoom(k > 1.01 ? 1 : 2.4, e.clientX, e.clientY, true); lastTap = 0; }
        else lastTap = now;
      }
      big.addEventListener('pointerup', release);
      big.addEventListener('pointercancel', release);
      big.addEventListener('dragstart', function (e) { e.preventDefault(); });
      view.addEventListener('wheel', function (e) {
        e.preventDefault();
        zoom(k * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY, false);
      }, { passive: false });
      layer.addEventListener('click', function (e) { if (e.target === layer || e.target === view || e.target === close) shut(); });
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      window.addEventListener('resize', onResize);
      document.addEventListener('keydown', onKey);

      var from = stage.getBoundingClientRect();
      document.body.appendChild(layer);
      document.body.style.overflow = 'hidden';
      rest.forEach(function (n) { if (n !== layer) n.inert = true; });
      load(at, false);
      var to = big.getBoundingClientRect();
      if (!reduceMotion && big.animate && to.width) {               // it grows out of the frame it was in
        big.animate([
          { transform: 'translate(' + (from.left + from.width / 2 - to.left - to.width / 2).toFixed(1) + 'px,' +
              (from.top + from.height / 2 - to.top - to.height / 2).toFixed(1) + 'px) scale(' + (from.width / to.width).toFixed(4) + ')' },
          { transform: 'none' }
        ], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
      setTimeout(function () { hint.classList.add('is-gone'); }, 4500);
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
    initCards();
    initNav();
    initReveal();
    initToc();
    initCount();
    initStack();
    initGlow();
    initMbo();
    initMaker();
    initTaker();
    initShots();
    initFlow();
    initSamsung();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
