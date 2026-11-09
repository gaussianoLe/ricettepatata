import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deployment,withBase} from '../src/lib/config.mjs';
import {normalize,matchesRecipe} from '../src/lib/search.mjs';

test('production and preview have explicit targets and independent default bases',()=>{
 assert.deepEqual(deployment('production'),{target:'production',site:'https://ricettepatata.it',base:'/'});
 assert.deepEqual(deployment('preview'),{target:'preview',site:'https://ricettepatata.it',base:'/anteprima/'});
 assert.equal(withBase('/ricette/','/anteprima/'),'/anteprima/ricette/');
 assert.equal(withBase('ricette/','/'),'/ricette/');
});

test('custom bases never change the target or the configured origin',()=>{
 for(const target of ['production','preview']) {
  for(const base of ['/','/anteprima/','/magazine/','/nested/magazine/']) {
   const config=deployment(target,{SITE_URL:'https://cucina.example',BASE_PATH:base});
   assert.deepEqual(config,{target,site:'https://cucina.example',base});
   assert.equal(withBase('ricette/',config.base),`${base}ricette/`);
  }
 }
 for(const target of ['development','staging','',undefined]) assert.throws(()=>deployment(target),/Target sconosciuto/);
});

test('production requires HTTPS; explicit preview permits HTTP for local development',()=>{
 for(const BASE_PATH of ['/','/magazine/','/anteprima/']) {
  assert.throws(()=>deployment('production',{SITE_URL:'http://localhost:4321',BASE_PATH}),/HTTPS/);
  assert.throws(()=>deployment('production',{SITE_URL:'http://cucina.example',BASE_PATH}),/HTTPS/);
  assert.equal(deployment('preview',{SITE_URL:'http://localhost:4321',BASE_PATH}).site,'http://localhost:4321');
 }
 assert.equal(deployment('production',{SITE_URL:'https://cucina.example:8443'}).site,'https://cucina.example:8443');
});

test('invalid origins and ambiguous base paths fail early for either target',()=>{
 for(const target of ['production','preview']) {
  for(const SITE_URL of ['https://example.org/path','https://user:secret@example.org','file:///tmp/','https://example.org/?x=1','https://example.org/#hash']) assert.throws(()=>deployment(target,{SITE_URL}));
  for(const BASE_PATH of ['anteprima','//bad/','/../','/demo','/a?b/']) assert.throws(()=>deployment(target,{BASE_PATH}));
 }
});

test('search ignores accents, spaces and case; all words and region must match',()=>{
 assert.equal(normalize('  RÖSTI  '),'rosti');
 const recipe={text:'Rösti Svizzera patate burro',region:'Europa'};
 assert.ok(matchesRecipe(recipe,' ROSTI burro ','Europa'));
 assert.ok(matchesRecipe(recipe,'','Tutte'));
 assert.equal(matchesRecipe(recipe,'rosti','Italia'),false);
 assert.equal(matchesRecipe(recipe,'rosti uova','Europa'),false);
 assert.equal(matchesRecipe(recipe,'<img src=x>','Tutte'),false);
});
