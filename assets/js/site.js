/* /var/lib/ZAWIERUCHA/ · site.js
   1) blokada osadzania strony w cudzej ramce (clickjacking),
   2) licznik odwiedzin GoatCounter bez zewnętrznego skryptu (piksel),
   3) zdarzenia kliknięć [data-goatcounter-click] i formularze [data-nosubmit]. */
(function () {
  'use strict';

  // 1. Strona osadzona w obcej ramce: ukryj treść i nie pozwól klikać.
  if (window.top !== window.self) {
    var same = false;
    try { same = window.top.location.hostname === window.location.hostname; } catch (e) { same = false; }
    if (!same) {
      document.documentElement.style.display = 'none';
      try { window.top.location.replace(window.location.href); } catch (e) {}
      return;
    }
  }

  // 2. Licznik GoatCounter (piksel, bez ciasteczek).
  var GC = 'https://varlib.goatcounter.com/count';
  function skip() {
    var h = window.location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1' || window.location.protocol === 'file:') return true;
    if (document.visibilityState === 'prerender') return true;
    try { if (localStorage.getItem('skipgc') === 't') return true; } catch (e) {}
    return false;
  }
  function send(p, t, ev) {
    if (skip()) return;
    var q = {
      p: p, t: t || '', r: ev ? '' : (document.referrer || ''),
      s: [screen.width, screen.height, window.devicePixelRatio || 1].join(','),
      b: navigator.webdriver ? 150 : 0, rnd: Math.random().toString(36).slice(2)
    };
    if (ev) q.e = 'true';
    var u = GC + '?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
    var img = new Image(); img.referrerPolicy = 'strict-origin-when-cross-origin'; img.src = u;
  }
  // Zgodne z API count.js: goatcounter.count({path, title, event})
  window.goatcounter = {
    count: function (o) { o = o || {}; send(String(o.path || window.location.pathname), o.title || document.title, !!o.event); }
  };

  function boot() {
    send(window.location.pathname, document.title, false);
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-goatcounter-click]') : null;
      if (el) send(el.getAttribute('data-goatcounter-click'), el.getAttribute('data-goatcounter-title') || el.getAttribute('data-goatcounter-click'), true);
    }, true);
    // 3. Formularze lokalne (quiz, kalkulator) nigdy nie są wysyłane.
    document.addEventListener('submit', function (e) {
      if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-nosubmit')) e.preventDefault();
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
