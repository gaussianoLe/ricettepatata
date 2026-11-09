import type {APIRoute} from 'astro';
import {href} from '../lib/urls';
export const GET: APIRoute = ({site}) => new Response(import.meta.env.BUILD_TARGET === 'preview' ? `User-agent: *\nDisallow: ${import.meta.env.BASE_URL}\n` : `User-agent: *\nAllow: ${import.meta.env.BASE_URL}\nSitemap: ${new URL(href('sitemap-index.xml'),site).href}\n`, {headers:{'Content-Type':'text/plain; charset=utf-8'}});
