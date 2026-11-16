import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {releaseEntry,releaseIds,reviewedSections} from '../editorial/release.mjs';
import {recipeSEO} from '../src/catalog/recipe-seo.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
import {verifyRelease} from '../scripts/release-check.mjs';
const fixture=existsSync('.astro/p1-catalog-fixtures.json')?JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json')):null;
const read=file=>file==='src/catalog/registry.json' && fixture?Buffer.from(fixture.registryText):readFileSync(file);
test('release preparation preserves baseline and only selects the two real drafts',()=>{
 const result=verifyRelease(read);assert.equal(result.prepared,2);assert.equal(result.published,0);
 for(const slug of ['gratin-dauphinois','patatas-bravas','missing','../../docs'])assert.equal(releaseEntry(slug),null);
 for(const slug of ['gatto-di-patate','papas-arrugadas-con-mojo']){
  const release=releaseEntry(slug);assert.ok(releaseIds.includes(release.researchId));
  assert.equal(release.entry.data.editorial.status,'draft');assert.equal(release.entry.data.demo,false);
  for(const target of ['production','preview'])assert.equal(isVisible(release.entry.data,target),false);
  for(const text of Object.values(release.sections).flat())assert.ok(release.entry.body.includes(text));
  assert.ok(release.sections.Allergeni.length);assert.ok(release.openIssues.length);
 }
});
test('SEO preserves known quantities and procedure without unsupported rich result claims',()=>{
 for(const slug of ['gatto-di-patate','papas-arrugadas-con-mojo']){
  const {entry,seo}=releaseEntry(slug),record=entry.data;
  assert.equal(seo.canonical,`https://ricettepatata.it/ricette/${slug}/`);
  assert.deepEqual(seo.schema.recipeInstructions.map(s=>s.text),record.steps.map(s=>s.text));
  assert.equal(seo.schema.recipeIngredient.length,record.ingredients.length);
  assert.equal(seo.schema.prepTime,`PT${record.timing.prepMinutes}M`);
  for(const field of ['image','nutrition','aggregateRating','review','totalTime','datePublished'])assert.equal(Object.hasOwn(seo.schema,field),false);
  const unknown={...record,timing:null,servings:null,provenance:{...record.provenance,traditions:[]}};
  const minimal=recipeSEO(unknown).schema;
  for(const field of ['prepTime','cookTime','totalTime','recipeYield','recipeCuisine'])assert.equal(Object.hasOwn(minimal,field),false);
  assert.deepEqual(seo.schema.citation,record.sources.map(s=>s.url));
 }
});
test('canonical/breadcrumb helpers support custom public bases without local or stale origin leakage',()=>{
 const record=releaseEntry('gatto-di-patate').entry.data;
 for(const base of ['/','/anteprima/','/magazine/']){
  const seo=recipeSEO(record,base);assert.equal(seo.canonical,`https://ricettepatata.it${base}ricette/${record.slug}/`);
  assert.equal(seo.breadcrumb.itemListElement[1].item,`https://ricettepatata.it${base}ricette/`);
 }
 for(const base of ['//evil.example/','../','/no-trailing','/a/../'])assert.throws(()=>recipeSEO(record,base));
});
test('reviewed text extraction omits absent sections and never generates HTML from source text',()=>{
 assert.deepEqual(reviewedSections('## Introduzione\n\nTesto <script>letterale</script>.\n\n## Allergeni\n\nLimite.'),{Introduzione:['Testo <script>letterale</script>.'],Allergeni:['Limite.']});
 assert.deepEqual(reviewedSections('Nessun approfondimento disponibile.'),{});
 const component=readFileSync('src/components/RecipeArticle.astro','utf8');assert.ok(!component.includes('set:html'));
});
test('release validation independently rejects operational or historical tampering',()=>{
 const baseline=JSON.parse(readFileSync('docs/editorial/p2.0/baseline.json'));
 for(const file of ['src/content/ricette/gatto-di-patate.md','src/catalog/policy.mjs','src/catalog/registry.json','docs/editorial/p1.9/dossiers/RP-0062.json']){
  assert.ok(baseline.files[file]);assert.throws(()=>verifyRelease(f=>f===file?Buffer.concat([read(f),Buffer.from('tampered')]):read(f)),/Baseline/);
 }
});
