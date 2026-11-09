export function deployment(mode, env = {}) {
  const site = env.SITE_URL || 'https://ricettepatata.it';
  const url = new URL(site);
  if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('SITE_URL deve essere un’origine HTTP(S), senza percorso o credenziali');
  const base = env.BASE_PATH ?? (mode === 'preview' ? '/anteprima/' : '/');
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('BASE_PATH deve iniziare e terminare con / e contenere solo segmenti semplici');
  return {site: url.origin, base, preview: base !== '/'};
}
export function withBase(path, base = '/') { return base + path.replace(/^\/+/, ''); }
