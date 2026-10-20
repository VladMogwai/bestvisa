import { IS_PREVIEW, SITE_URL } from '../data/site.js';

const PRODUCTION = `User-agent: *
Disallow: /shared/send_form.php
Disallow: *?*
Disallow: *openstat=
Disallow: *from=
Disallow: *utm*=

Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id&yclid&ysclid&ymclid&gclid&fbclid&msclkid&_openstat&from&roistat&roistat_referrer&price /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const PREVIEW = `User-agent: *
Disallow: /
`;

export const GET = () => new Response(IS_PREVIEW ? PREVIEW : PRODUCTION, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
