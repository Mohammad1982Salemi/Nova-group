/* Runs before first paint, from the page's head (a file rather than inline, so the site's
   Content-Security-Policy can refuse every inline script).

   Samsung Internet (also used inside Telegram and WhatsApp) recolours pages in its dark mode; flag it early. */
if (/SamsungBrowser/i.test(navigator.userAgent)) document.documentElement.classList.add('sb');

/* Everyone meets the site in English. A reader who has chosen another language (in the language menu,
   or with a ?lang=fr in the address) is taken to that language's page from then on. */
(function () {
  var d = document.documentElement, want = null, asked = /[?&]lang=(en|fa|fr|de|tr)\b/.exec(location.search);
  try { if (asked) localStorage.setItem('nova-lang', asked[1]); want = localStorage.getItem('nova-lang'); } catch (e) {}
  if (asked) want = asked[1];
  if (!/^(fa|fr|de|tr)$/.test(want || '')) want = 'en';
  if (d.hasAttribute('data-both')) {
    // the one page that carries every language: under /fr/ it reads in French, and so on
    var under = /^\/(fa|fr|de|tr)\//.exec(location.pathname), l = under ? under[1] : want;
    d.setAttribute('data-lang', l); d.lang = l; d.dir = l === 'fa' ? 'rtl' : 'ltr';
  } else if (want !== 'en' && d.getAttribute('data-alt')) {
    // an English address is the default one: a reader who chose another language is sent on to the same page under its code
    d.style.visibility = 'hidden';
    setTimeout(function () { d.style.visibility = ''; }, 2500);
    location.replace(d.getAttribute('data-alt').replace('*', want) + location.hash);
    return;
  }
  d.className += ' js';
  var sameAgain = false;
  try {
    // the same page in another language: the reader is put back in place, so nothing plays its entrance again
    if (sessionStorage.getItem('nova-place')) { d.className += ' is-returning'; sameAgain = true; }
    // arriving from a project's card: its name travels into this page's heading, which must be there from the first frame
    var card = sessionStorage.getItem('nova-card');
    if (card) {
      sessionStorage.removeItem('nova-card');
      if (location.pathname.indexOf('/projects/' + card + '.html') > -1) d.className += ' from-card';
    }
  } catch (e) {}
  // which way along the menu this page lies from the one just left: it comes in from that side
  function way(e) {
    // a change of language is the same page again. It takes the old one's place at once: fading one language
    // into another would show two texts of different lengths lying over each other for a moment.
    if (sameAgain && e && e.viewTransition) {
      var vt = e.viewTransition;
      if (vt.ready && vt.ready.catch) vt.ready.catch(function () { /* skipped on purpose */ });
      vt.skipTransition();
    }
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
