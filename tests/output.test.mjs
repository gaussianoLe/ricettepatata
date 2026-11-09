import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {deployment} from '../src/lib/config.mjs';
const {site,base,preview}=deployment(process.env.TEST_TARGET || 'production',process.env);
const root=path.resolve('dist');
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
test('all generated pages have metadata, valid local links, assets and structured data',async()=>{
 const pages=(await files(root)).filter(f=>f.endsWith('.html'));assert.equal(pages.length,15);
 for(const file of pages){
 const html=await readFile(file,'utf8');const relative=path.relative(root,file).replaceAll(path.sep,'/');const route=relative==='index.html'?'':relative==='404.html'?'404/':relative.replace(/index\.html$/,'');
 assert.ok(html.includes('lang="it"'),file);assert.match(html,/<title>[^<]+<\/title>/);assert.match(html,/<meta name="description" content="[^"]+"/);
 assert.ok(html.includes(`rel="canonical" href="${site}${base}${route}"`),`canonical ${relative}`);
 if(preview || relative==='404.html')assert.match(html,/name="robots" content="noindex, nofollow"/);
 for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
 const data=JSON.parse(json);assert.equal(data['@context'],'https://schema.org');
 if(data['@type']==='Recipe'){assert.ok(data.recipeIngredient.length>=2);assert.ok(data.recipeInstructions.length>=2);assert.match(data.totalTime,/^PT\d+M$/);assert.ok(data.url.startsWith(site+base+'ricette/'));}
 }
 for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 if(raw.startsWith('#') || /^(https?:|data:|mailto:)/.test(raw))continue;
 const url=new URL(raw,site+base+route);assert.ok(url.pathname.startsWith(base),`${relative}: ${raw} escapes base`);
 const local=decodeURIComponent(url.pathname.slice(base.length));const target=path.join(root,local);assert.ok(target.startsWith(root));
 const info=await stat(target).catch(()=>null);assert.ok(info,`${relative}: missing ${raw}`);
 if(info?.isDirectory())await stat(path.join(target,'index.html'));
 }
 }
});
test('production sitemap and preview indexing policy',async()=>{
 const robots=await readFile(path.join(root,'robots.txt'),'utf8');
 if(preview){assert.ok(robots.includes(`Disallow: ${base}`));assert.ok(!(await files(root)).some(f=>f.endsWith('.xml')));}
 else {assert.ok(robots.includes(`Sitemap: ${site}/sitemap-index.xml`));const sitemap=await readFile(path.join(root,'sitemap-0.xml'),'utf8');assert.ok(sitemap.includes(`${site}/ricette/`));assert.ok(!sitemap.includes('/anteprima/'));assert.ok(!sitemap.includes('/404'));}
});
