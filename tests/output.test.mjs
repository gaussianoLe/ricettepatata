import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {deployment} from '../src/lib/config.mjs';
import {contentIds} from './helpers/catalog.mjs';
const {site,base,target}=deployment(process.env.TEST_TARGET || 'production',process.env);
const preview=target==='preview';
const root=path.resolve('dist');
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const routeFor=file=>file==='index.html'?'':file==='404.html'?'404/':file.replace(/index\.html$/,'');

test('the local preview settings preserve the resolved build configuration',async()=>{
 const saved=JSON.parse(await readFile('.astro/ricettepatata-build.json','utf8'));
 assert.deepEqual(saved,{target,site,base});
});

test('every source entry has a page and is linked from its collection index',async()=>{
 const generated=new Set((await files(root)).map(file=>path.relative(root,file).replaceAll(path.sep,'/')));
 for(const fixed of ['index.html','404.html','ricette/index.html','curiosita/index.html','guide/index.html']) assert.ok(generated.has(fixed),`missing ${fixed}`);
 for(const collection of ['ricette','curiosita','guide']) {
  const ids=contentIds(collection);assert.ok(ids.length>0,`${collection} must not be empty`);
  const index=await readFile(path.join(root,collection,'index.html'),'utf8');
  for(const id of ids) {
   assert.ok(generated.has(`${collection}/${id}/index.html`),`missing content page ${collection}/${id}`);
   assert.ok(index.includes(`href="${base}${collection}/${id}/"`),`unlisted content ${collection}/${id}`);
  }
 }
});

test('all generated pages have metadata, valid local links, assets and structured data',async()=>{
 const pages=(await files(root)).filter(f=>f.endsWith('.html'));assert.ok(pages.length>0);
 for(const file of pages){
 const html=await readFile(file,'utf8');const relative=path.relative(root,file).replaceAll(path.sep,'/');const route=routeFor(relative);
 assert.ok(html.includes('lang="it"'),file);assert.match(html,/<title>[^<]+<\/title>/);assert.match(html,/<meta name="description" content="[^"]+"/);
 assert.ok(html.includes(`rel="canonical" href="${site}${base}${route}"`),`canonical ${relative}`);
 if(preview || relative==='404.html') assert.match(html,/name="robots" content="noindex, nofollow"/);
 else assert.doesNotMatch(html,/<meta name="robots"/);
 assert.equal(html.includes('class="preview-banner"'),preview,`preview banner ${relative}`);
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];assert.ok(schemas.length>0,`missing schema ${relative}`);
 for(const [,json] of schemas){
 const data=JSON.parse(json);assert.equal(data['@context'],'https://schema.org');
 if(data['@type']==='Recipe'){assert.ok(data.recipeIngredient.length>=2);assert.ok(data.recipeInstructions.length>=2);assert.match(data.totalTime,/^PT\d+M$/);assert.ok(data.url.startsWith(site+base+'ricette/'));}
 }
 for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 if(raw.startsWith('#') || /^(https?:|data:|mailto:)/.test(raw))continue;
 const url=new URL(raw,site+base+route);assert.ok(url.pathname.startsWith(base),`${relative}: ${raw} escapes base`);
 const local=decodeURIComponent(url.pathname.slice(base.length));const destination=path.join(root,local);assert.ok(destination.startsWith(root));
 const info=await stat(destination).catch(()=>null);assert.ok(info,`${relative}: missing ${raw}`);
 if(info?.isDirectory())await stat(path.join(destination,'index.html'));
 }
 }
});

test('sitemap and robots follow the target independently of the base path',async()=>{
 const generated=await files(root);const robots=await readFile(path.join(root,'robots.txt'),'utf8');
 const xmlFiles=generated.filter(file=>file.endsWith('.xml'));
 if(preview){assert.equal(robots,`User-agent: *\nDisallow: ${base}\n`);assert.equal(xmlFiles.length,0);}
 else {
  assert.equal(robots,`User-agent: *\nAllow: ${base}\nSitemap: ${site}${base}sitemap-index.xml\n`);
  assert.ok(xmlFiles.some(file=>path.basename(file)==='sitemap-index.xml'));
  const sitemaps=await Promise.all(xmlFiles.filter(file=>path.basename(file)!=='sitemap-index.xml').map(file=>readFile(file,'utf8')));
  const urls=new Set(sitemaps.flatMap(xml=>[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1])));
  const pages=generated.filter(file=>file.endsWith('.html') && path.basename(file)!=='404.html');
  for(const file of pages) assert.ok(urls.has(`${site}${base}${routeFor(path.relative(root,file).replaceAll(path.sep,'/'))}`),`missing sitemap URL ${file}`);
  for(const url of urls){assert.ok(url.startsWith(site+base));assert.notEqual(url,`${site}${base}404/`);}
 }
});
