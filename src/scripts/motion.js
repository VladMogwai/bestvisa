// Motion in the spirit of montarville.ca: Lenis smooth scroll, masked word reveals,
// clip-path media reveals with parallax, staggered cards, counters, intro, hiding header.
// Content is fully visible without JS; nothing runs with prefers-reduced-motion.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function showAll() {
  document.querySelectorAll('[data-split]').forEach((el) => el.classList.add('is-split'));
  root.classList.remove('js-intro');
}

if (reduce) {
  showAll();
} else {
  // Split after fonts load so line breaks are measured with the real font.
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(init);
}

function init() {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const EXPO = 'expo.out';

  // ---------- Smooth scroll ----------
  const lenis = new Lenis({ duration: 1.15, anchors: { offset: -88 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ---------- Header hides on scroll down ----------
  const header = document.querySelector('[data-header]');
  lenis.on('scroll', ({ direction, scroll }) => {
    header?.classList.toggle('is-hidden', direction === 1 && scroll > 200 && !document.querySelector('.header__nav.is-open'));
  });

  // ---------- Headings: words rise from a mask ----------
  function splitHeading(el) {
    const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'line-mask' });
    el.classList.add('is-split');
    return split;
  }

  const heroHeadings = [];
  document.querySelectorAll('[data-split]').forEach((el) => {
    const split = splitHeading(el);
    const inHero = el.closest('.hero');
    const tween = gsap.from(split.words, {
      yPercent: 110,
      duration: 1.2,
      ease: EXPO,
      stagger: { amount: 0.25 },
      paused: Boolean(inHero),
      scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 90%' },
    });
    if (inHero) heroHeadings.push(tween);
  });

  // ---------- Wordmark letters ----------
  const marks = [...document.querySelectorAll('[data-wordmark]')];
  marks.forEach((m) => {
    const split = SplitText.create(m, { type: 'chars', mask: 'chars' });
    const inHero = m.closest('.hero, .intro');
    const tween = gsap.from([...split.chars, m.querySelector('b')], {
      yPercent: 100,
      duration: 1.3,
      ease: EXPO,
      stagger: 0.04,
      paused: Boolean(inHero),
      scrollTrigger: inHero ? undefined : { trigger: m, start: 'top 95%' },
    });
    if (inHero) m._tween = tween;
  });

  // ---------- Hero entrance ----------
  function playHero() {
    const tl = gsap.timeline();
    const mark = document.querySelector('.hero [data-wordmark]');
    if (mark?._tween) tl.add(mark._tween.play(), 0);
    heroHeadings.forEach((t) => tl.add(t.play(), mark ? 0.25 : 0));
    tl.fromTo('.hero [data-fade]', { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: EXPO, stagger: 0.08 }, 0.35);
    tl.fromTo('.hero [data-media]', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut' }, 0.1);
    tl.from('.hero [data-media] [data-parallax]', { scale: 1.3, duration: 1.8, ease: EXPO }, 0.1);
    tl.from('.hero [data-float]', { y: 80, rotate: 12, opacity: 0, duration: 1.4, ease: EXPO }, 0.7);
    tl.fromTo('.hero [data-stagger]', { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.6);
    tl.from('.hero [data-stagger] > *', { y: 24, opacity: 0, duration: 1, ease: EXPO, stagger: 0.06 }, 0.6);
    tl.from('.hero .crumbs, .hero .trust', { opacity: 0, duration: 0.8 }, 0.2);
    return tl;
  }

  // ---------- Intro: once per session ----------
  const intro = document.querySelector('.intro');
  if (root.classList.contains('js-intro') && intro) {
    lenis.stop();
    const mark = intro.querySelector('[data-wordmark]');
    gsap
      .timeline({
        onComplete: () => {
          root.classList.remove('js-intro');
          lenis.start();
        },
      })
      .add(mark._tween.play())
      .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '+=0.15')
      .add(playHero(), '-=0.55');
    try {
      sessionStorage.setItem('bv_intro', '1');
    } catch (e) {}
  } else {
    playHero();
  }

  // ---------- Media: clip reveal + parallax ----------
  document.querySelectorAll('[data-media]').forEach((box) => {
    const img = box.querySelector('[data-parallax]');
    if (img) {
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
    }
    if (!box.closest('.hero')) {
      gsap.from(box, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: box, start: 'top 85%' } });
    }
  });

  document.querySelectorAll('.band').forEach((band) => {
    const bg = band.querySelector('.band__bg');
    if (bg) gsap.fromTo(bg, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
  });

  document.querySelectorAll('.dest').forEach((card) => {
    const img = card.querySelector('img');
    gsap.from(card, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: card, start: 'top 90%' } });
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
  });

  document.querySelectorAll('.prose img, .footer__photos img').forEach((img) => {
    gsap.from(img, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: img, start: 'top 90%' } });
  });

  // ---------- Cards and lists: staggered rise ----------
  const groups = '.cols, .plans, .types, .compare, .posts, .chips, .faq, .band__list, .checks, .pp__rows, .footer__links, .footer__list';
  document.querySelectorAll(groups).forEach((group) => {
    if (group.closest('.hero') || group.closest('.plan')) return;
    gsap.from(group.children, {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: EXPO,
      stagger: 0.06,
      scrollTrigger: { trigger: group, start: 'top 88%' },
    });
  });

  // Text blocks outside the hero
  document.querySelectorAll('.section-head .lead, .section-head .eyebrow, .info > .eyebrow, .ask, .discount, .cta__lead, .cta__contacts, .form, .proof h2, .about p, .about .btn').forEach((el) => {
    gsap.from(el, { y: 28, opacity: 0, duration: 1.1, ease: EXPO, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  // Long migrated text: animate in batches as it scrolls in
  gsap.set('.prose > *:not(img)', { y: 20, opacity: 0 });
  ScrollTrigger.batch('.prose > *:not(img)', {
    start: 'top 96%',
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.9, ease: EXPO, stagger: 0.04 }),
  });

  // ---------- Service cards: each rises in from its side of the staircase ----------
  document.querySelectorAll('.services .service').forEach((card, i) => {
    gsap.from(card, {
      x: i % 2 ? 80 : -80,
      y: 60,
      opacity: 0,
      duration: 1.3,
      ease: EXPO,
      scrollTrigger: { trigger: card, start: 'top 90%' },
    });
  });

  // ---------- Counters ----------
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.textContent.replace(/\D/g, ''));
    if (!target) return;
    const fmt = new Intl.NumberFormat('ru-RU');
    const state = { v: 0 };
    gsap.to(state, {
      v: target,
      duration: 2.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => (el.textContent = fmt.format(Math.round(state.v))),
    });
  });

  // ---------- Decorative geometry drifts with scroll ----------
  document.querySelectorAll('[data-geo]').forEach((svg) => {
    gsap.to(svg, { yPercent: 16, rotate: 8, ease: 'none', scrollTrigger: { trigger: svg.closest('section, footer') || svg, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // ---------- Footer wordmark rises ----------
  const footMark = document.querySelector('.footer__mark .wordmark');
  if (footMark) gsap.from(footMark, { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  // Layout can shift once fonts and lazy images load
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
}
