import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {releaseEntry} from '../editorial/release.mjs';
import {articlePresentation} from '../editorial/presentation.mjs';
import {formatIngredient} from '../src/catalog/view.mjs';
import {verifyUX,uxSnapshot} from '../scripts/ux-check.mjs';
const fixture=existsSync('.astro/p1-catalog-fixtures.json')?JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json')):null;
const read=file=>file==='src/catalog/registry.json'&&fixture?Buffer.from(fixture.registryText):readFileSync(file);
test('UX baseline independently protects P1.x, P2.0, recipes, SEO and public policy',()=>{
 assert.equal(verifyUX(read).operationalChanges,0);
 for(const file of ['docs/editorial/p2.0/report.json','docs/editorial/p1.9/dossiers/RP-0062.json','src/catalog/recipe-seo.mjs','src/catalog/policy.mjs','src/content/ricette/gatto-di-patate.md'])assert.throws(()=>verifyUX(f=>f===file?Buffer.concat([read(f),Buffer.from('changed')]):read(f)),/Baseline UX/);
});
test('deterministic display projection preserves every operational ingredient and never mutates input',()=>{
 for(const slug of ['gatto-di-patate','papas-arrugadas-con-mojo']){
  const {entry}=releaseEntry(slug),before=structuredClone(entry),p=articlePresentation(entry);
  assert.deepEqual(entry,before);assert.deepEqual(articlePresentation(entry),p);
  assert.deepEqual(p.ingredients.map(i=>i.id),entry.data.ingredients.map(i=>i.id));
  for(const ingredient of entry.data.ingredients){const i=p.ingredients.find(i=>i.id===ingredient.id);assert.equal(i.name,ingredient.name);assert.equal(i.optional,ingredient.optional);assert.equal(i.amount,formatIngredient({...ingredient,name:'',preparation:undefined,optional:false}).trim());}
  for(const trace of p.trace)assert.ok(trace.source.startsWith(entry.file));
  for(const text of [p.intro,...p.cookingNotes,...p.supplements.flatMap(s=>s.paragraphs)])assert.ok(entry.body.includes(text)||entry.data.ingredients.some(i=>i.preparation?.includes(text)));
 }
});
test('methodological ingredient details move out of the reader row without losing cooking constraints',()=>{
 const g=articlePresentation(releaseEntry('gatto-di-patate').entry),p=articlePresentation(releaseEntry('papas-arrugadas-con-mojo').entry);
 assert.equal(g.ingredients.find(i=>i.id==='pangrattato-pirofila').detail,'');assert.ok(g.cookingNotes.includes('I 20 g elencati restano per la superficie.'));
 assert.equal(p.ingredients.find(i=>i.id==='mojo').detail,'');assert.equal(p.ingredients.find(i=>i.id==='acqua').amount,'circa 2 l');
 assert.ok(p.supplements.find(s=>s.id==='timing').paragraphs.join(' ').includes('Il mojo deve essere pronto'));
 for(const projection of [g,p]){assert.ok(projection.supplements.some(s=>s.id==='allergens'));assert.ok(projection.supplements.some(s=>s.id==='storage'));assert.ok(!JSON.stringify({...projection,trace:[]}).includes('draft precedente'));}
});
test('unrecognized slugs or source drift cannot silently generate attractive invented prose',()=>{
 const {entry}=releaseEntry('gatto-di-patate');
 assert.throws(()=>articlePresentation({...entry,data:{...entry.data,slug:'gratin-dauphinois'}}),/non autorizzata/);
 assert.throws(()=>articlePresentation({...entry,body:entry.body.replace('Un composto di patate lega fiordilatte e salumi in una teglia quadrata.','Testo diverso.')}),/non presente/);
});
test('frozen UX manifest reproduces actual presentation and unchanged SEO',()=>{
 assert.deepEqual(uxSnapshot(),JSON.parse(readFileSync('docs/editorial/p2.1/presentation.json')));
 assert.throws(()=>verifyUX(f=>f.endsWith('presentation.json')?Buffer.from('{}'):read(f)),/discordante/);
});
