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

  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 4. Zakładki szkoleń (AI / Microsoft 365 / Na start), WAI-ARIA.
  function courseTabs() {
    var list = document.querySelector('.ctabs');
    if (!list) return;
    var tabs = [].slice.call(list.querySelectorAll('[role=tab]'));
    function sel(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t, p = document.getElementById(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; if (p) p.hidden = !on;
      });
      if (focus) t.focus();
    }
    function byPanel(id) { for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('aria-controls') === id) return tabs[i]; return null; }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        var n = null, k = e.key;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0]; if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); sel(n, true); }
      });
    });
    sel(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
    // linki do #m365 (menu, podstrony) otwierają właściwą zakładkę
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$="#m365"],a[href$="#cp-start"],a[href$="#cp-ai"]');
      if (!a) return; var t = byPanel(a.getAttribute('href').split('#')[1]); if (t) sel(t);
    }, true);
    var h = window.location.hash.slice(1), t0 = h && byPanel(h);
    if (t0) { sel(t0); setTimeout(function () { var s = document.getElementById('szkolenia'); if (s) s.scrollIntoView(); }, 0); }
  }

  // 5. Łagodne pojawianie się sekcji i odliczanie liczb w hero.
  function reveal() {
    var els = document.querySelectorAll('section.s .head, .course, .step, .sl, .acard, .pak > div, .tier, .q');
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    [].forEach.call(els, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return; // już widoczne: bez animacji
      el.classList.add('rv'); io.observe(el);
    });
    setTimeout(function () { [].forEach.call(document.querySelectorAll('.rv:not(.in)'), function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); }); }, 2500);
  }
  function countUp() {
    if (reduce) return;
    [].forEach.call(document.querySelectorAll('.proof b'), function (b) {
      var m = b.textContent.match(/^(\d+)(.*)$/); if (!m) return;
      var end = +m[1], rest = m[2], t0 = null, dur = 1200;
      function step(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        b.textContent = v + rest; if (k < 1) requestAnimationFrame(step); }
      b.textContent = '0' + rest; requestAnimationFrame(step);
    });
  }

  function boot() {
    courseTabs(); reveal(); countUp();
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
