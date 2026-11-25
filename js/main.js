/* Healing Childhood Wounds — draft site interactions. */
(function () {
  'use strict';

  /* Phone is OFF by founder decision. Keep PUBLIC_PHONE empty unless the founders approve a number. */
  var SHOW_PHONE = false;
  var PUBLIC_PHONE = '';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (!reduce) root.classList.add('motion');
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- phone (off) ---------- */
  var phoneEl = $('.js-phone');
  if (phoneEl && SHOW_PHONE && PUBLIC_PHONE) {
    var a = document.createElement('a');
    a.href = 'tel:' + PUBLIC_PHONE.replace(/[^0-9+]/g, '');
    a.textContent = PUBLIC_PHONE;
    phoneEl.appendChild(a);
    phoneEl.hidden = false;
  }

  /* ---------- intro ---------- */
  function finishIntro() {
    try { sessionStorage.setItem('hcw-intro', '1'); } catch (e) {}
    root.classList.remove('intro-on');
    root.classList.add('intro-done');
    if (window.__introFS) clearTimeout(window.__introFS);
    if (hasST) ScrollTrigger.refresh();
  }

  function runIntro() {
    if (!root.classList.contains('intro-on')) return;
    if (!hasGsap) { finishIntro(); return; }

    var stage = $('#introStage');
    var emblem = $('#introEmblem');
    var cover = $('#heroCover');
    var bg = $('.intro__bg');
    var hIn = $$('.h-in');
    var skip = $('#introSkip');
    var done = false;

    /* Hero items: hold them hidden with inline styles so removing the class does not pop them in. */
    gsap.set(hIn, { opacity: 0, y: 18 });

    function heroIn(fast) {
      gsap.to(hIn, { opacity: 1, y: 0, duration: fast ? 0.35 : 0.8, stagger: fast ? 0.03 : 0.07, ease: 'power3.out', clearProps: 'opacity,transform' });
    }
    function end(fast) {
      if (done) return;
      done = true;
      finishIntro();
      heroIn(fast);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') { tl.kill(); end(true); } }
    document.addEventListener('keydown', onKey);
    skip.addEventListener('click', function () { tl.kill(); end(true); });

    $$('.intro__geo .g-draw').forEach(function (el) {
      var len = el.getTotalLength ? el.getTotalLength() : 400;
      el.style.strokeDasharray = len + ' ' + len;
      el.style.strokeDashoffset = len;
    });

    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.to('.intro__dot', { opacity: 1, scale: 1.4, duration: 0.35 }, 0)
      .fromTo('.g-rip', { attr: { r: 2 }, opacity: 0.9 }, { attr: { r: 40 }, opacity: 0, duration: 1.4, stagger: 0.22, ease: 'power2.out' }, 0.2)
      .fromTo(emblem, { clipPath: 'circle(0% at 65% 61%)', scale: 1.06 }, { clipPath: 'circle(75% at 65% 61%)', scale: 1, duration: 1.35, ease: 'power2.inOut' }, 0.35)
      .to('.intro__dot', { opacity: 0, scale: 0.4, duration: 0.5 }, 0.9)
      .to('.intro__geo .g-draw', { strokeDashoffset: 0, duration: 1.2, stagger: 0.05, ease: 'power2.inOut' }, 0.4)
      .fromTo('.g-diamond, .g-star', { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05 }, 0.7)
      .fromTo('.g-orbit', { rotation: -70, opacity: 0, svgOrigin: '50 49' }, { rotation: 0, opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.7)
      .to('.intro__eyebrow', { opacity: 1, y: 0, duration: 0.6 }, 1.0)
      .fromTo('.intro__title', { opacity: 0, y: 14, letterSpacing: '0.06em' }, { opacity: 1, y: 0, letterSpacing: '0em', duration: 0.8 }, 1.3)
      .add(flip, 2.0);

    function flip() {
      var to = cover && cover.getBoundingClientRect();
      var from = stage.getBoundingClientRect();
      gsap.to(['.intro__geo', '.intro__rips', '.intro__dot', '.intro__eyebrow', '.intro__title', skip], { opacity: 0, duration: 0.3 });
      var visible = to && to.width > 40 && to.top >= 0 && to.bottom <= window.innerHeight + 40;
      if (!visible) {
        gsap.to([stage, bg], { opacity: 0, duration: 0.5, onComplete: function () { end(false); } });
        heroIn(false);
        return;
      }
      var tx = to.left + 0.1091 * to.width;
      var ty = to.top + 0.1702 * to.height;
      var s = (0.7576 * to.width) / from.width;
      gsap.set(stage, { transformOrigin: '0 0' });
      gsap.to(stage, { x: tx - from.left, y: ty - from.top, scale: s, duration: 0.85, ease: 'power3.inOut' });
      gsap.to(bg, { opacity: 0, duration: 0.6, delay: 0.25, ease: 'power1.out' });
      heroIn(false);
      gsap.to(stage, { opacity: 0, duration: 0.3, delay: 0.85, onComplete: function () { end(false); } });
    }

    /* Start once the emblem is ready (or after 500 ms). Fit the whole play inside the 3 s failsafe. */
    var ready = emblem.decode ? emblem.decode().catch(function () {}) : Promise.resolve();
    var timeout = new Promise(function (r) { setTimeout(r, 500); });
    Promise.race([ready, timeout]).then(function () {
      if (done) return;
      var left = 2800 - performance.now();
      if (left < 1100) { end(true); return; }
      var need = 3150; /* timeline + flip ≈ 3.15 s */
      if (left < need) tl.timeScale(need / left);
      tl.play();
    });
  }
  runIntro();

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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Current section in the nav */
  if ('IntersectionObserver' in window) {
    var navLinks = $$('#nav a:not(.btn)');
    var map = {};
    navLinks.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.remove('is-current'); });
        if (map[en.target.id]) map[en.target.id].classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section, main > div').forEach(function (el) { navIO.observe(el); });
  }

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

  /* ---------- hero book: tilt to the pointer ---------- */
  var book = $('#heroBook');
  if (book && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var inner = $('.book__inner', book);
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) {
      if (root.classList.contains('intro-on')) return;
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      inner.style.transform = 'rotateY(' + (px * 14 - 6) + 'deg) rotateX(' + (-py * 8) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () { inner.style.transform = ''; });
  }

  /* ---------- scroll-linked art (GSAP) ---------- */
  if (hasST && !reduce) {
    /* Hero: art drifts, geometry turns. */
    gsap.to('.hero__art', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__geo', { rotation: 18, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* The question: words light up as you read. */
    $$('[data-words]').forEach(function (h) {
      var words = h.textContent.trim().split(/\s+/);
      h.setAttribute('aria-label', h.textContent.trim());
      h.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
      gsap.to($$('.w', h), { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: h, start: 'top 85%', end: 'top 35%', scrub: true } });
    });

    /* Big I and little i: the gold thread draws between them. */
    var thread = $('.ii__thread');
    if (thread) {
      var tl0 = thread.getTotalLength();
      gsap.set(thread, { strokeDasharray: tl0, strokeDashoffset: tl0 });
      var spark = $('.ii__spark');
      var sparkPos = { t: 0 };
      var iiTl = gsap.timeline({ scrollTrigger: { trigger: '.ii', start: 'top 80%', end: 'center 45%', scrub: 0.6 } });
      iiTl.fromTo('.ii__small', { scale: 0.7, transformOrigin: '266px 282px' }, { scale: 1, duration: 0.3 }, 0)
        .to(thread, { strokeDashoffset: 0, duration: 0.7, ease: 'none' }, 0.2)
        .fromTo('.ii__spark', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.2)
        .to(sparkPos, { t: 1, duration: 0.7, ease: 'none', onUpdate: function () { var pt = thread.getPointAtLength(sparkPos.t * tl0); spark.setAttribute('cx', pt.x); spark.setAttribute('cy', pt.y); } }, 0.2)
        .fromTo('.ii__big', { scale: 0.92, transformOrigin: '150px 150px' }, { scale: 1, duration: 0.3 }, 0.7);
      gsap.to('.ii__ripple', { attr: { r: '+=14' }, opacity: 0, duration: 2.4, repeat: -1, stagger: 1.2, ease: 'power1.out' });
    }

    /* Map yourself: branches grow from YOU. */
    var brs = $$('.br');
    brs.forEach(function (p) { var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    var brTl = gsap.timeline({ scrollTrigger: { trigger: '.mapme__viz', start: 'top 75%', once: true } });
    brTl.from('.br-core', { scale: 0, transformOrigin: '210px 210px', duration: 0.7, ease: 'back.out(1.6)' })
      .to(brs, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out' }, 0.3)
      .from('.br-node', { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.12, ease: 'back.out(2)' }, 0.9)
      .from('.branch-qs li', { opacity: 0, y: 10, duration: 0.5, stagger: 0.12 }, 1.0);

    /* Mission: the three rings breathe apart as you pass. */
    gsap.fromTo('.mission__rings circle', { attr: { r: 40 } }, { attr: { r: 70 }, ease: 'none', scrollTrigger: { trigger: '.mission', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.mission__rings', { rotation: 40, ease: 'none', scrollTrigger: { trigger: '.mission', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* About portrait: slow parallax inside the arch. */
    gsap.fromTo('.arch img', { yPercent: -4, scale: 1.08 }, { yPercent: 4, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.arch', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- the Mind Map ---------- */
  var mm = $('#mind-map');
  var cards = $$('.mm-card');
  var dotsWrap = $('#mmDots');
  var phases = $$('.mm__phase');
  var ring = $('#mmRing');
  var railFill = $('#mmRailFill');
  var RING = 358.14;
  var current = -1;
  var leaveTimer = null;

  cards.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Panel ' + (i + 1) + ': ' + $('h3', c).textContent);
    b.textContent = i + 1;
    b.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(b);
  });
  var dots = $$('button', dotsWrap);

  function setActive(i) {
    if (i === current) return;
    var prev = current;
    current = i;
    cards.forEach(function (c, k) {
      c.classList.toggle('is-active', k === i);
      c.classList.toggle('is-leaving', k === prev);
    });
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(function () { cards.forEach(function (c) { c.classList.remove('is-leaving'); }); }, 1000);
    dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
    var ph = i < 3 ? 0 : i < 6 ? 1 : 2;
    phases.forEach(function (p, k) { p.classList.toggle('is-on', k <= ph); });
  }

  var pinST = null;
  function goTo(i) {
    if (!pinST) return;
    var y = pinST.start + (pinST.end - pinST.start) * ((i + 0.5) / cards.length);
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  function mobileCards() {
    if (reduce || !('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.add('in'); }); return null; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.25 });
    cards.forEach(function (c) { io.observe(c); });
    return io;
  }

  if (hasST && !reduce) {
    var mmMedia = gsap.matchMedia();
    mmMedia.add('(min-width: 900px)', function () {
      mm.classList.add('is-pinned');
      cards.forEach(function (c) { c.classList.remove('in'); });
      current = -1;
      setActive(0);
      pinST = ScrollTrigger.create({
        trigger: '#mmPin',
        start: 'top top',
        end: function () { return '+=' + window.innerHeight * 5.4; },
        pin: true,
        scrub: true,
        onUpdate: function (self) {
          var p = self.progress;
          var i = Math.min(cards.length - 1, Math.floor(p * cards.length));
          setActive(i);
          if (ring) ring.style.strokeDashoffset = RING * (1 - p);
          if (railFill) railFill.style.transform = 'scaleY(' + p + ')';
        }
      });
      return function () {
        mm.classList.remove('is-pinned');
        cards.forEach(function (c) { c.classList.remove('is-active', 'is-leaving'); });
        current = -1;
        pinST = null;
      };
    });
    mmMedia.add('(max-width: 899px)', function () {
      var io = mobileCards();
      return function () { if (io) io.disconnect(); };
    });
  } else {
    mobileCards();
  }

  /* ---------- forms (client-side; endpoints to be connected) ---------- */
  var MSG = {
    intro: 'Thank you. The full introduction is unlocked.',
    worksheets: 'Thank you. Your worksheets are on their way to your inbox.',
    waitlist: 'Thank you. You will be the first to know.',
    session: 'Thank you. Dr. Judy will reach out to you personally.'
  };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  $$('.js-form').forEach(function (form) {
    var msg = $('.form__msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('input, textarea', form).forEach(function (f) {
        var v = f.value.trim();
        var ok = true;
        if (f.required && !v) ok = false;
        if (ok && f.type === 'email' && v && !EMAIL.test(v)) ok = false;
        if (ok && f.type === 'tel' && v && v.replace(/\D/g, '').length < 7) ok = false;
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        msg.classList.remove('ok');
        msg.textContent = bad.type === 'email' ? 'Please enter a valid email address.' : bad.type === 'tel' ? 'Please enter a phone number we can reach you on.' : 'Please fill in the required fields.';
        bad.focus();
        return;
      }
      var kind = form.getAttribute('data-form');
      var endpoint = form.getAttribute('data-endpoint');
      var success = function () {
        form.classList.add('is-sent');
        msg.classList.add('ok');
        msg.textContent = MSG[kind] || 'Thank you.';
        if (kind === 'intro') unlockFull();
      };
      if (endpoint) {
        fetch(endpoint, { method: 'POST', body: new FormData(form) }).then(success, function () {
          msg.classList.remove('ok');
          msg.textContent = 'Something went wrong. Please email info@psychologicalhealingcenter.com.';
        });
      } else {
        /* Draft preview: no endpoint yet, so say so honestly instead of faking success. */
        form.classList.add('is-sent');
        msg.classList.remove('ok');
        msg.textContent = kind === 'intro' ? 'Preview draft: this form is not connected yet, so your email was not saved. Here is the full introduction.' : 'Preview draft: this form is not connected yet, so nothing was sent. Please email info@psychologicalhealingcenter.com.';
        if (kind === 'intro') unlockFull();
      }
    });
  });

  /* ---------- free video: 1-minute preview, then the email gate ---------- */
  var player = $('#player');
  var video = $('#teaser');
  var bigPlay = $('#teaserPlay');
  var gate = $('#gate');
  var frame = $('.player__frame');
  var full = $('#fullIntro');

  function playTeaser() {
    gate.hidden = true;
    frame.classList.remove('has-gate');
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (video) {
    video.controls = false;
    bigPlay.addEventListener('click', playTeaser);
    video.addEventListener('play', function () { player.classList.add('is-playing'); video.controls = true; });
    video.addEventListener('ended', function () {
      gate.hidden = false;
      frame.classList.add('has-gate');
      var input = $('#gate-email');
      if (input && !$('form', gate).classList.contains('is-sent')) input.focus({ preventScroll: true });
    });
    $('#gateReplay').addEventListener('click', function () { video.currentTime = 0; playTeaser(); });
  }

  function unlockFull() {
    setTimeout(function () {
      if (!full.firstChild) {
        var f = document.createElement('iframe');
        f.src = 'https://player.vimeo.com/video/1040984820?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
        f.title = 'Healing Childhood Wounds: the full introduction';
        f.allow = 'autoplay; fullscreen; picture-in-picture';
                full.appendChild(f);
      }
      gate.hidden = true;
      frame.classList.remove('has-gate');
      video.pause();
      full.hidden = false;
      player.classList.add('is-playing');
    }, 900);
  }

  /* Recalculate pins once fonts and images settle. */
  if (hasST) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
