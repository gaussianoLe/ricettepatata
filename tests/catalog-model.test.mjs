import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readCatalog} from '../src/catalog/io.mjs';
import {recipeSchema,articleSchema} from '../src/catalog/schema.mjs';
import {validateCatalog} from '../src/catalog/validate.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
import {recipeView} from '../src/catalog/view.mjs';
import {matchesCatalogRecipe} from '../src/catalog/filters.mjs';
const entries=readCatalog();
const baseline=entries.find(entry=>entry.collection==='ricette' && entry.data.slug==='rosti').data;
const clone=()=>structuredClone(baseline);
const wrap=data=>({collection:'ricette',data,body:''});
const registryFor=values=>Object.fromEntries(values.map(entry=>[entry.data.catalogId,{collection:entry.collection,slug:entry.data.slug}]));
function certified(status='published') {
 const data=clone();data.catalogId=randomUUID();data.slug=`test-${data.catalogId}`;data.demo=false;
 data.editorial={status,author:'Test author',reviewer:'Test reviewer',reviewedAt:'2026-11-09',...(status==='published'?{publishedAt:'2026-11-09'}:{})};
 data.sources=[{id:'external',kind:'secondary',title:'Synthetic source',url:'https://example.org/test',author:'Test source author',accessedAt:'2026-11-09'}];return data;
}

test('migration preserves every historic ID/slug and demo remains draft with internal provenance',()=>{
 const legacy=JSON.parse(readFileSync('src/catalog/legacy-routes.json','utf8'));
 for(const [route,id] of Object.entries(legacy)) {
  const entry=entries.find(entry=>entry.data.catalogId===id);assert.ok(entry);assert.equal(`${entry.collection}/${entry.data.slug}`,route);
  assert.equal(entry.data.editorial.status,'draft');assert.equal(entry.data.demo,true);assert.ok(entry.data.sources.every(source=>source.kind==='internal'));
 }
});
test('compatibility view keeps string ingredients, steps, titles and old geographic filters',()=>{
 const data=clone();const view=recipeView(data);
 assert.equal(view.title,'Rösti croccanti');assert.equal(view.region,'Europa');assert.equal(view.total,35);
 assert.ok(view.ingredients.every(value=>typeof value==='string'));assert.ok(view.steps.every(value=>typeof value==='string'));
 const pitta=entries.find(entry=>entry.data.slug==='pitta-di-patate').data;assert.equal(recipeView(pitta).country,'Salento, Italia');assert.equal(recipeView(pitta).region,'Italia');
 data.timing.restMinutes=15;assert.equal(recipeView(data).total,50);
});
test('multilingual search and structured AND facets support international catalogs',()=>{
 const data=clone();data.potatoRole='secondary';data.names.alternatives.push({text:'Kartoffelkuchen',language:'de'});
 assert.ok(matchesCatalogRecipe(data,{query:'kartoffelkuchen',country:'CH',continent:'europe',potatoRole:'secondary',ingredients:['patata','burro'],cookingMethods:['padella']}));
 for(const filter of [{potatoRole:'protagonist'},{country:'IT'},{continent:'asia'},{ingredients:['farina']},{courses:['dolce']},{families:['zuppe']},{occasions:['natale']},{query:'inesistente'}]) assert.equal(matchesCatalogRecipe(data,filter),false);
});
test('candidate can be incomplete but draft and later states require a complete potato recipe',()=>{
 const data=clone();data.editorial.status='candidate';data.timing=null;data.servings=null;data.ingredients=[];data.steps=[];data.provenance={continent:null,country:null,region:null,traditions:[]};data.taxonomy={courses:[],cookingMethods:[],families:[],occasions:[]};
 assert.ok(recipeSchema.safeParse(data).success);assert.equal(isVisible(data,'preview'),false);
 data.editorial.status='draft';assert.equal(recipeSchema.safeParse(data).success,false);
});
test('quantities, identifiers, controlled taxonomies and procedure references are validated',()=>{
 const invalid=[data=>data.ingredients[0].quantity.value=-1,data=>data.ingredients[0].quantity={value:2,max:1,unit:'kg'},data=>data.ingredients[0].quantity={value:0,unit:'g'},data=>data.ingredients[0].quantity.unit='unknown',data=>data.steps[0].ingredientIds=['missing'],data=>data.steps.push(data.steps[0]),data=>data.ingredients.push(data.ingredients[0]),data=>data.ingredients=data.ingredients.filter(ingredient=>ingredient.ingredientId!=='patata'),data=>data.taxonomy.courses=['inventato'],data=>data.provenance.country.code='ITA',data=>data.catalogId='mutable-title',data=>data.slug='../unsafe',data=>data.unexpected=true];
 for(const mutate of invalid){const data=clone();mutate(data);assert.equal(recipeSchema.safeParse(data).success,false);}
 const data=clone();data.timing={prepMinutes:0,cookMinutes:0,restMinutes:0};assert.ok(recipeSchema.safeParse(data).success);
});
test('verified/published require actual editorial assertions and external sources, not a demo flag alone',()=>{
 for(const status of ['verified','published']) {
  const valid=certified(status);assert.ok(recipeSchema.safeParse(valid).success);
  for(const mutate of [data=>data.demo=true,data=>delete data.editorial.reviewer,data=>data.editorial.reviewer=data.editorial.author,data=>delete data.editorial.reviewedAt,data=>data.sources=[],data=>data.sources[0].kind='internal',data=>data.editorial.reviewedAt='2020-01-01']) {
   const data=structuredClone(valid);mutate(data);assert.equal(recipeSchema.safeParse(data).success,false);
  }
 }
 const published=certified();delete published.editorial.publishedAt;assert.equal(recipeSchema.safeParse(published).success,false);
 const draft=clone();draft.editorial.publishedAt='2026-11-09';assert.equal(recipeSchema.safeParse(draft).success,false);
});
test('cultural notes cite real source IDs, validated URLs, author and consultation date',()=>{
 const data=certified();data.notes=[{id:'history',kind:'history',text:'Synthetic claim',sourceIds:['external']}];assert.ok(recipeSchema.safeParse(data).success);
 for(const mutate of [record=>record.notes[0].sourceIds=['missing'],record=>record.sources[0].url='javascript:alert(1)',record=>record.sources[0].url='https://secret:password@example.org',record=>record.sources[0].author='',record=>record.sources[0].accessedAt='2026-02-30',record=>record.sources.push(record.sources[0])]) {
  const record=structuredClone(data);mutate(record);assert.equal(recipeSchema.safeParse(record).success,false);
 }
});
test('global identity, slug reservations, and external IDs reject accidental deduplication conflicts',()=>{
 const uppercase=clone();uppercase.catalogId=uppercase.catalogId.toUpperCase();assert.equal(recipeSchema.safeParse(uppercase).success,false);
 const one=wrap(clone()),two=wrap(clone());assert.throws(()=>validateCatalog([one,two],registryFor([one])),/catalogId duplicato/);
 two.data.catalogId=randomUUID();assert.throws(()=>validateCatalog([one,two],registryFor([one,two])),/Slug riservato duplicato/);
 two.data.slug='different';one.data.externalIds=[{namespace:'test',value:'123'}];two.data.externalIds=[{namespace:'test',value:'123'}];assert.throws(()=>validateCatalog([one,two],registryFor([one,two])),/esterno duplicato/);
 const original=registryFor([one]);one.data.slug='changed';assert.throws(()=>validateCatalog([one],original),/Identità\/slug/);
});
test('variants point directly to primary IDs; dangling relations, duplicate chains and cycles fail',()=>{
 const primary=wrap(clone()),variant=wrap(clone());variant.data.catalogId=randomUUID();variant.data.slug='regional-variant';variant.data.relation={kind:'variant',primaryId:primary.data.catalogId};
 assert.equal(validateCatalog([primary,variant],registryFor([primary,variant])).length,2);
 const missing=structuredClone(variant);missing.data.relation.primaryId=randomUUID();assert.throws(()=>validateCatalog([primary,missing],registryFor([primary,missing])),/inesistente/);
 primary.data.relation={kind:'variant',primaryId:variant.data.catalogId};assert.throws(()=>validateCatalog([primary,variant],registryFor([primary,variant])),/principale canonica/);
 primary.data.relation={kind:'primary'};primary.data.duplicateOf=variant.data.catalogId;variant.data.relation={kind:'primary'};variant.data.duplicateOf=primary.data.catalogId;assert.throws(()=>validateCatalog([primary,variant],registryFor([primary,variant])),/Catene e cicli/);
});
test('published variants and articles cannot link unpublished recipes',()=>{
 const primary=wrap(clone()),variant=wrap(certified());variant.data.relation={kind:'variant',primaryId:primary.data.catalogId};assert.throws(()=>validateCatalog([primary,variant],registryFor([primary,variant])),/principale pubblicata/);
 const article={collection:'guide',data:structuredClone(entries.find(entry=>entry.collection==='guide').data),body:''};
 article.data.demo=false;article.data.editorial=structuredClone(variant.data.editorial);article.data.sources=variant.data.sources;article.data.relatedRecipeIds=[primary.data.catalogId];assert.ok(articleSchema.safeParse(article.data).success);
 assert.throws(()=>validateCatalog([primary,article],registryFor([primary,article])),/solo ricette pubblicate/);
});
test('target-specific publication excludes candidates, verified-but-unpublished records and duplicates',()=>{
 for(const status of ['candidate','draft','review','verified','published']) {
  const data=['verified','published'].includes(status)?certified(status):clone();data.editorial.status=status;
  assert.equal(isVisible(data,'production'),status==='published');assert.equal(isVisible(data,'preview'),status!=='candidate');
 }
 const duplicate=clone();duplicate.duplicateOf=randomUUID();assert.equal(isVisible(duplicate,'preview'),false);
 assert.throws(()=>isVisible(clone(),'unknown'));
});
test('global validation handles 5,000 independent candidate records without name-based merging',()=>{
 const data=clone();data.editorial.status='candidate';data.ingredients=[];data.steps=[];data.timing=null;data.servings=null;
 const many=Array.from({length:5000},(_,index)=>wrap({...structuredClone(data),catalogId:randomUUID(),slug:`scale-${index}`}));
 assert.equal(validateCatalog(many,registryFor(many)).length,many.length);
});

test('CI fixtures work on a fresh checkout without .astro and restore the original catalog',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'ricettepatata-fresh-ci-'));
 try {
  const legacy=JSON.parse(readFileSync('src/catalog/legacy-routes.json','utf8'));
  const registry={};mkdirSync(path.join(root,'src/catalog'),{recursive:true});
  for(const [route,catalogId] of Object.entries(legacy)) {
   const [collection,slug]=route.split('/');mkdirSync(path.join(root,'src/content',collection),{recursive:true});
   copyFileSync(path.resolve(`src/content/${route}.md`),path.join(root,`src/content/${route}.md`));
   registry[catalogId]={collection,slug};
  }
  const registryPath=path.join(root,'src/catalog/registry.json');
  writeFileSync(registryPath,JSON.stringify(registry));
  const script=path.resolve('tests/helpers/catalog-fixtures.mjs');
  assert.equal(existsSync(path.join(root,'.astro')),false);
  execFileSync(process.execPath,[script,'add'],{cwd:root});
  const manifest=path.join(root,'.astro/p1-catalog-fixtures.json');assert.ok(existsSync(manifest));
  const {files}=JSON.parse(readFileSync(manifest,'utf8'));assert.ok(files.length>0);
  execFileSync(process.execPath,[script,'remove'],{cwd:root});
  assert.equal(existsSync(manifest),false);for(const file of files)assert.equal(existsSync(path.join(root,file)),false);
  assert.deepEqual(JSON.parse(readFileSync(registryPath,'utf8')),registry);
 } finally {rmSync(root,{recursive:true,force:true});}
});
