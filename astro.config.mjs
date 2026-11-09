import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { deployment } from './src/lib/config.mjs';
const mode = process.env.BUILD_TARGET || 'production';
const config = deployment(mode, {...loadEnv(mode, process.cwd(), ''), ...process.env});
export default defineConfig({
 site: config.site, base: config.base, output: 'static', trailingSlash: 'always',
 integrations: config.target === 'preview' ? [] : [sitemap({filter: page => !page.endsWith('/404/')})],
 vite: {plugins: [tailwindcss()], define: {'import.meta.env.BUILD_TARGET': JSON.stringify(config.target)}},
});
