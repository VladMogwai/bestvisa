// Calm motion, no libraries: blocks fade up once as they enter, numbers roll like an odometer,
// the header gets a hairline after scrolling. Everything is visible without JS,
// and nothing moves with prefers-reduced-motion.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Header hairline ----------
const header = document.querySelector('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

// ---------- Reveal on scroll ----------
// Groups reveal their children one after another; single blocks reveal on their own.
const GROUPS = '.cols, .plans, .types, .services, .dests, .posts, .compare, .strip__list, .product__perks';
const SINGLES = '.section-head, .info > h2, .info > .prose, .statement, .ask, .discount, .about > *, .cta > *, .counter, .proof > *, .faq, .ui';

if (!reduce && 'IntersectionObserver' in window) {
  const items = [];
  document.querySelectorAll(GROUPS).forEach((g) => {
    [...g.children].forEach((el, i) => {
      el.dataset.reveal = '';
      el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
      items.push(el);
    });
  });
  document.querySelectorAll(SINGLES).forEach((el) => {
    if (el.closest('[data-reveal]')) return;
    el.dataset.reveal = '';
    items.push(el);
  });

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => {
    // Already on screen at load: show without waiting
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
    else io.observe(el);
  });
}

// ---------- Odometer ----------
// <span data-odometer>21 623</span> → each digit is a reel that rolls to its value.
document.querySelectorAll('[data-odometer]').forEach((el) => {
  const text = el.textContent.trim();
  if (reduce || !/\d/.test(text)) return;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const reels = [];
  for (const ch of text) {
    if (!/\d/.test(ch)) {
      const sep = document.createElement('span');
      sep.className = 'odo-sep';
      sep.textContent = ch === ' ' || ch === ' ' ? '' : ch;
      if (sep.textContent) sep.style.width = 'auto';
      sep.setAttribute('aria-hidden', 'true');
      el.append(sep);
      continue;
    }
    const box = document.createElement('span');
    box.className = 'odo';
    box.setAttribute('aria-hidden', 'true');
    const reel = document.createElement('span');
    reel.className = 'odo__reel';
    // Two full turns before landing on the digit
    const digits = [];
    for (let n = 0; n < 20; n++) digits.push(n % 10);
    digits.push(Number(ch));
    reel.innerHTML = digits.map((d) => `<span>${d}</span>`).join('');
    box.append(reel);
    el.append(box);
    reels.push(reel);
  }
  const run = () =>
    reels.forEach((reel, i) => {
      const steps = reel.children.length - 1;
      reel.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${steps}em)` }], {
        duration: 1600 + i * 180,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      });
    });
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      run();
      io.disconnect();
    }
  });
  io.observe(el);
});
