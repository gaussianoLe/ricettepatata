import type {APIRoute} from 'astro';
export const GET: APIRoute = ({site}) => new Response(import.meta.env.BASE_URL !== '/' ? `User-agent: *\nDisallow: ${import.meta.env.BASE_URL}\n` : `User-agent: *\nAllow: /\nDisallow: /anteprima/\nSitemap: ${new URL('sitemap-index.xml',site).href}\n`, {headers:{'Content-Type':'text/plain; charset=utf-8'}});
