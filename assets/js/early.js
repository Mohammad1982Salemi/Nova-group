/* Runs before first paint, from the page's head (a file rather than inline, so the site's
   Content-Security-Policy can refuse every inline script).

   Samsung Internet (also used inside Telegram and WhatsApp) recolours pages in its dark mode; flag it early. */
if (/SamsungBrowser/i.test(navigator.userAgent)) document.documentElement.classList.add('sb');

/* Everyone meets the site in English. A reader who has chosen Persian (with the language button,
   or a ?lang=fa in the address) is taken to the Persian page from then on. */
(function () {
  var d = document.documentElement, want = null, asked = /[?&]lang=(fa|en)\b/.exec(location.search);
  try { if (asked) localStorage.setItem('nova-lang', asked[1]); want = localStorage.getItem('nova-lang'); } catch (e) {}
  if (asked) want = asked[1];
  if (want !== 'fa') want = 'en';
  if (d.hasAttribute('data-both')) {
    // the one page that carries both languages: under /fa/ it reads in Persian
    var l = location.pathname.indexOf('/fa/') === 0 ? 'fa' : want;
    d.setAttribute('data-lang', l); d.lang = l; d.dir = l === 'fa' ? 'rtl' : 'ltr';
  } else if (want === 'fa' && d.getAttribute('data-alt')) {
    // an English address is the default one: a reader who chose Persian is sent on to the same page under /fa/
    d.style.visibility = 'hidden';
    setTimeout(function () { d.style.visibility = ''; }, 2500);
    location.replace(d.getAttribute('data-alt') + location.hash);
    return;
  }
  d.className += ' js';
  try {
    // the same page in the other language: the reader is put back in place, so nothing plays its entrance again
    if (sessionStorage.getItem('nova-place')) d.className += ' is-returning';
    // arriving from a project's card: its name travels into this page's heading, which must be there from the first frame
    var card = sessionStorage.getItem('nova-card');
    if (card) {
      sessionStorage.removeItem('nova-card');
      if (location.pathname.indexOf('/projects/' + card + '.html') > -1) d.className += ' from-card';
    }
  } catch (e) {}
  // which way along the menu this page lies from the one just left: it comes in from that side
  function way() {
    var here = d.getAttribute('data-sec'), from = null;
    d.classList.remove('vt-fwd', 'vt-back');
    try { from = sessionStorage.getItem('nova-sec'); if (here !== null) sessionStorage.setItem('nova-sec', here); } catch (e) {}
    if (here !== null && from !== null && from !== here) d.classList.add(+here > +from ? 'vt-fwd' : 'vt-back');
  }
  if ('onpagereveal' in window) window.addEventListener('pagereveal', way); else way();
  // a short opening, once per visit and never for people who asked for less motion
  try {
    if (!sessionStorage.getItem('nova-seen') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('nova-seen', '1'); d.className += ' intro';
    }
  } catch (e) {}
})();
