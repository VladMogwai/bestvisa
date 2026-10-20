// Lead forms, first-touch attribution and Yandex Metrika goals.
// Field names and the bv_ft storage format match the old site's script.js,
// so /shared/send_form.php keeps receiving exactly what it expects.

const METRIKA_ID = 105543340;
const ENDPOINT = '/shared/send_form.php';
const PREVIEW = document.documentElement.dataset.env === 'preview';

const goal = (name, params) => {
  try {
    window.ym?.(METRIKA_ID, 'reachGoal', name, params);
  } catch (e) {}
};

// ---------- First touch (90 days, not overwritten by internal navigation) ----------
const FT_KEY = 'bv_ft';
const FT_DAYS = 90;
const isOwn = (h) => !h || /(^|\.)bestvisa\.ru$/.test(h);
const isYandex = (h) => /(^|\.)(yandex\.(ru|com|by|kz|ua)|ya\.ru|ya\.com)$/.test(h);
const isGoogle = (h) => /(^|\.)google\./.test(h);
const isSeo = (h) => isYandex(h) || isGoogle(h) || /(^|\.)(bing\.com|mail\.ru|rambler\.ru|duckduckgo\.com|yahoo\.com)$/.test(h);
const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch (e) {
    return '';
  }
};
const isDirect = (ft) => !ft || !ft.src || ft.src === 'direct' || ft.mdm === 'direct';

function readFt() {
  try {
    const raw = localStorage.getItem(FT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const m = document.cookie.match(/(?:^|; )bv_ft=([^;]*)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch (e) {
    return null;
  }
}

function writeFt(ft) {
  const raw = JSON.stringify(ft);
  try {
    localStorage.setItem(FT_KEY, raw);
  } catch (e) {}
  const exp = new Date(Date.now() + FT_DAYS * 864e5).toUTCString();
  const enc = encodeURIComponent(raw);
  if (location.hostname.endsWith('bestvisa.ru')) {
    document.cookie = `${FT_KEY}=${enc}; expires=${exp}; path=/; domain=.bestvisa.ru; SameSite=Lax`;
  }
  document.cookie = `${FT_KEY}=${enc}; expires=${exp}; path=/; SameSite=Lax`;
}

function captureFt() {
  const p = new URLSearchParams(location.search);
  const ref = document.referrer || '';
  const host = hostOf(ref);
  const ft = {
    src: 'direct',
    mdm: 'direct',
    cmp: p.get('utm_campaign') || '',
    cnt: p.get('utm_content') || '',
    trm: p.get('utm_term') || '',
    lp: location.pathname,
    ref: ref || 'direct',
    yclid: p.get('yclid') || '',
    ysclid: p.get('ysclid') || '',
    gclid: p.get('gclid') || '',
    from: 'direct',
    ts: Date.now(),
  };
  if (p.get('utm_source')) Object.assign(ft, { src: p.get('utm_source'), mdm: p.get('utm_medium') || '', from: 'utm' });
  else if (p.get('yclid')) Object.assign(ft, { src: 'yandex', mdm: 'cpc', from: 'yclid' });
  else if (p.get('gclid')) Object.assign(ft, { src: 'google', mdm: 'cpc', from: 'gclid' });
  else if (p.get('ysclid')) Object.assign(ft, { src: 'yandex', mdm: 'organic', from: 'ysclid' });
  else if (isSeo(host)) Object.assign(ft, { src: isYandex(host) ? 'yandex' : isGoogle(host) ? 'google' : host, mdm: 'organic', from: 'referrer' });
  else if (host && !isOwn(host)) Object.assign(ft, { src: host, mdm: 'referral', from: 'referrer' });
  return ft;
}

let stored = readFt();
const now = captureFt();
if (!stored || (isDirect(stored) && !isDirect(now))) {
  stored = now;
  writeFt(stored);
}
const getFt = () => readFt() || stored;

// ---------- Phone input ----------
const isRuPhone = (v) => /^[78]\d{10}$/.test((v || '').replace(/\D/g, ''));

function formatPhone(value) {
  let d = value.replace(/\D/g, '');
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  const parts = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = '+7';
  if (parts[0]) out += ' ' + parts[0];
  if (parts[1]) out += ' ' + parts[1];
  if (parts[2]) out += ' ' + parts[2];
  if (parts[3]) out += ' ' + parts[3];
  return out;
}

document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener('input', () => {
    input.value = formatPhone(input.value);
  });
});

// ---------- Submit ----------
const pageLoadedAt = Date.now();

function collect(form) {
  const fd = new FormData(form);
  const data = {
    phone: fd.get('phone') || '',
    email: fd.get('email') || '',
    form_type: form.dataset.lead,
    page: fd.get('page') || document.title,
  };
  if (fd.get('name')) data.name = fd.get('name');
  if (fd.has('comment')) data.comment = fd.get('comment') || '';

  data.page_url = location.href;
  data.referrer = document.referrer || 'direct';
  const p = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'yclid', 'ysclid', 'gclid'].forEach((k) => {
    if (p.get(k)) data[k] = p.get(k);
  });

  const ft = getFt();
  if (ft) {
    Object.assign(data, {
      landing_page: ft.lp || location.pathname,
      ft_source: ft.src || '',
      ft_medium: ft.mdm || '',
      ft_campaign: ft.cmp || '',
      ft_content: ft.cnt || '',
      ft_term: ft.trm || '',
      ft_referrer: ft.ref || '',
      ft_from: ft.from || '',
    });
    ['yclid', 'ysclid', 'gclid'].forEach((k) => {
      if (!data[k] && ft[k]) data[k] = ft[k];
    });
    if (!data.utm_source && ft.from === 'utm' && ft.src) {
      data.utm_source = ft.src;
      if (ft.mdm) data.utm_medium = ft.mdm;
      if (ft.cmp) data.utm_campaign = ft.cmp;
      if (ft.cnt) data.utm_content = ft.cnt;
      if (ft.trm) data.utm_term = ft.trm;
    }
    Object.assign(data, { sb_source: ft.src || '', sb_medium: ft.mdm || '', sb_campaign: ft.cmp || '', sb_content: ft.cnt || '', sb_term: ft.trm || '' });
  } else {
    data.landing_page = location.pathname;
  }

  Object.assign(data, {
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    browser: navigator.userAgent,
    page_h1: document.querySelector('h1')?.textContent.trim() || '',
    screen_resolution: `${screen.width}x${screen.height}`,
    window_size: `${innerWidth}x${innerHeight}`,
    pixel_ratio: String(devicePixelRatio || ''),
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) {
        return '';
      }
    })(),
    language: navigator.language || '',
    languages: (navigator.languages || []).join(','),
    touch_points: String(navigator.maxTouchPoints || 0),
    platform: navigator.platform || '',
    hardware_concurrency: String(navigator.hardwareConcurrency || ''),
    device_memory: String(navigator.deviceMemory || ''),
    cookies_enabled: String(navigator.cookieEnabled),
    connection_type: navigator.connection?.effectiveType || '',
    time_on_page: String(Math.round((Date.now() - pageLoadedAt) / 1000)),
  });
  return data;
}

function setStatus(form, state, text) {
  const el = form.querySelector('.lead__status');
  if (!el) return;
  el.dataset.state = state;
  el.textContent = text;
}

const FAIL = 'Не удалось отправить заявку. Позвоните нам: +7 (495) 085-99-97 или напишите в мессенджер.';

document.querySelectorAll('form[data-lead]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const data = collect(form);

    // Honeypot: bots get a fake success.
    if (data.email) {
      setStatus(form, 'ok', 'Спасибо! Мы свяжемся с вами в ближайшее время.');
      form.reset();
      return;
    }
    if (!isRuPhone(data.phone)) {
      setStatus(form, 'error', 'Укажите российский номер в формате +7XXXXXXXXXX. Если номер иностранный, напишите его в комментарии или в мессенджер.');
      form.querySelector('input[type="tel"]')?.focus();
      return;
    }
    if (form.querySelector('[name="name"]') && !data.name) {
      setStatus(form, 'error', 'Укажите, как к вам обращаться.');
      form.querySelector('[name="name"]').focus();
      return;
    }
    const consent = form.querySelector('[name="consent"]');
    if (consent && !consent.checked) {
      setStatus(form, 'error', 'Нужно согласие на обработку персональных данных.');
      return;
    }

    if (PREVIEW) {
      setStatus(form, 'ok', 'Превью: заявка не отправлена. На продакшене она уйдёт в send_form.php.');
      console.info('[preview] lead payload', data);
      return;
    }

    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Отправляем…';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'send_form failed');
      goal('lead_submit', { form: data.form_type });
      setStatus(form, 'ok', result.message || 'Спасибо! Специалист перезвонит вам в течение 15 минут.');
      form.reset();
    } catch (err) {
      setStatus(form, 'error', FAIL);
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});

// "Оставить заявку" on a tariff or "Задать вопрос": prefill the comment and jump to the form.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-order]');
  if (!trigger) return;
  const comment = document.getElementById('cta-comment');
  if (comment) comment.value = trigger.dataset.order;
  goal('click_order', { what: trigger.dataset.order });
});

// ---------- Contact click goals ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-goal]');
  if (el) goal(el.dataset.goal);
});

// ---------- Mobile menu ----------
const burger = document.querySelector('.burger');
burger?.addEventListener('click', () => {
  const nav = document.getElementById('site-nav');
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
});
