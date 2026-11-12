import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
const entries=JSON.parse(readFileSync('docs/editorial/p1.4/records.json','utf8')).entries;
const files=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(item=>item.isDirectory()?files(path.join(folder,item.name)):[path.join(folder,item.name)]);
test('editorial drafts cannot leak into static pages, search data or sitemap in either target',()=>{
 const text=files('dist').filter(f=>/\.(html|xml|json)$/.test(f)).map(f=>readFileSync(f,'utf8')).join('\n');
 for(const entry of entries){
  assert.equal(existsSync(`dist/ricette/${entry.data.slug}/index.html`),false);
  assert.equal(text.includes(entry.data.catalogId),false);
  assert.equal(text.includes(`/ricette/${entry.data.slug}/`),false);
  assert.equal(text.includes(entry.data.description),false);
 }
});
