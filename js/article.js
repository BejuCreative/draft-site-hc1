/* Article pages + article library. Small on purpose: no GSAP needed here. */
(function () {
  'use strict';
  window.__artReady = true;
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }

  /* Phone stays hidden until the practice approves a public number. */
  var SHOW_PHONE = false;
  var PUBLIC_PHONE = '';
  if (SHOW_PHONE && PUBLIC_PHONE) {
    $$('.js-phone').forEach(function (el) {
      el.innerHTML = '<a href="tel:' + PUBLIC_PHONE.replace(/[^\d+]/g, '') + '">' + PUBLIC_PHONE + '</a>';
      el.hidden = false;
    });
  }

  /* ---------- header + menu ---------- */
  var header = $('.site-header');
  var menuBtn = $('#menuBtn');
  function closeMenu() {
    header.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', function () {
    var open = header.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#nav a').forEach(function (l) { l.addEventListener('click', closeMenu); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- scroll: header state + reading progress ---------- */
  var bar = $('#progress');
  var art = $('#article');
  var ticking = false;
  function onScroll() {
    ticking = false;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (bar && art) {
      var r = art.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- reveals ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rvIO.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach(function (el) { rvIO.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- table of contents: highlight the current part ---------- */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var heads = tocLinks.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var setOn = function (id) {
      tocLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + id); });
    };
    var tocIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setOn(en.target.id); });
    }, { rootMargin: '-15% 0px -70% 0px' });
    heads.forEach(function (h) { tocIO.observe(h); });
  }
  $$('.toc-m a').forEach(function (a) {
    a.addEventListener('click', function () { var dt = a.closest('details'); if (dt) dt.open = false; });
  });

  /* ---------- library: topic filter (also reads #topic=… from article tags) ---------- */
  var grid = $('#libGrid');
  if (grid) {
    var chips = $$('.chip');
    var cards = $$('.rcard', grid);
    var count = $('#libCount');
    var feat = $('.feat-wrap');
    var apply = function (topic, push) {
      var shown = 0;
      chips.forEach(function (c) {
        var on = c.getAttribute('data-topic') === topic;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var all = topic === 'all';
      grid.classList.toggle('is-filtered', !all);
      if (feat) feat.hidden = !all;
      cards.forEach(function (card) {
        var ok = all ? !card.classList.contains('is-feat-dup')
                     : (' ' + card.getAttribute('data-topics') + ' ').indexOf(' ' + topic + ' ') > -1;
        card.hidden = !ok;
        if (ok) {
          shown++;
          card.classList.add('in');
          if (!reduce) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
        }
      });
      if (count) count.textContent = all ? cards.length + ' articles' : 'Showing ' + shown + ' of ' + cards.length;
      if (push) {
        var url = all ? location.pathname : location.pathname + '#topic=' + topic;
        history.replaceState(null, '', url);
      }
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () { apply(c.getAttribute('data-topic'), true); });
    });
    var fromHash = function () {
      var m = /topic=([a-z-]+)/.exec(location.hash);
      if (m && $('.chip[data-topic="' + m[1] + '"]')) apply(m[1], false);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  /* ---------- fallback page fade where View Transitions are missing ---------- */
  if (root.classList.contains('no-vt') && !reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /^(mailto|tel):/.test(a.href)) return;
      if (url.pathname === location.pathname && url.hash) return; /* same-page anchor */
      e.preventDefault();
      root.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 200);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('is-leaving'); });
  }
})();
