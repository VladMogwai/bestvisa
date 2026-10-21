export const SITE_URL = 'https://visabest.pro';

// "preview" builds (Cloudflare Pages) are closed from indexing and do not send leads.
export const IS_PREVIEW = import.meta.env.PUBLIC_ENV === 'preview';

// visabest.pro needs its own counter and Webmaster code; empty values switch them off.
export const METRIKA_ID = null;
export const YANDEX_VERIFICATION = '';

export const company = {
  name: 'BestVisa',
  fullName: 'Паспортно-визовый центр BestVisa',
  legal: 'ИП Ковалевич В.Н., ИНН 741514422991, ОГРНИП 319745600207562',
  since: 2013,
  clients: '21 623',
  phone: '+7 (495) 085-99-97',
  phoneHref: 'tel:+74950859997',
  email: 'info@bestvisa.ru',
  hours: 'Работаем с 10:00 до 18:00 МСК',
  address: 'Москва, ул. Тверская, 20/1, стр. 1, офис 427',
  street: 'ул. Тверская, 20/1, стр. 1, офис 427',
  metro: ['Тверская', 'Пушкинская', 'Чеховская'],
  geo: { lat: 55.7648, lon: 37.6056 },
  mapWidget: 'https://yandex.ru/map-widget/v1/?um=constructor%3A556e227cd7ce517be9a21f1c07b9c436f416160e4a7efd56848e19f8c3848eeb&source=constructor',
  rating: { value: '5,0', count: 104, url: 'https://yandex.ru/maps/org/42347843733/reviews' },
  yandexOrgId: '42347843733',
};

export const messengers = [
  { id: 'tg', name: 'Телеграм', href: 'https://t.me/bestvisasbot' },
  { id: 'wa', name: 'Ватсап', href: 'https://wa.me/79060122950' },
  { id: 'max', name: 'Макс', href: 'https://max.ru/id741514422991_bot' },
];

export const nav = [
  { name: 'Визовый центр', href: '/o-kompanii-best-visa/' },
  { name: 'Загранпаспорт', href: '/uslugi/zagran-passport-srochno/' },
  { name: 'Оформление виз', href: '/uslugi/oformlenie-viz/' },
  { name: 'Зарубежные карты', href: '/uslugi/karty-inostrannykh-bankov/' },
  { name: 'Страхование', href: '/uslugi/strakhovanie/' },
  { name: 'Карта АТЭС', href: '/uslugi/karta-ates/' },
  { name: 'Туры за рубеж', href: '/uslugi/tury-za-rubezh/' },
  { name: 'Приглашения в РФ', href: '/uslugi/priglasheniya-v-rf/' },
  { name: 'ВНЖ в Европе', href: '/uslugi/vnzh-v-evrope/' },
];
