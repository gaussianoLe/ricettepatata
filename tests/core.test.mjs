import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deployment,withBase} from '../src/lib/config.mjs';
import {normalize,matchesRecipe} from '../src/lib/search.mjs';
test('production and preview use the intended origin and base',()=>{
 assert.deepEqual(deployment('production'),{site:'https://ricettepatata.it',base:'/',preview:false});
 assert.deepEqual(deployment('preview'),{site:'https://ricettepatata.it',base:'/anteprima/',preview:true});
 assert.equal(withBase('/ricette/','/anteprima/'),'/anteprima/ricette/');
 assert.equal(withBase('ricette/','/'),'/ricette/');
 assert.equal(deployment('production',{SITE_URL:'https://test.example',BASE_PATH:'/demo/'}).base,'/demo/');
});
test('invalid origins and ambiguous base paths fail early',()=>{
 for(const SITE_URL of ['https://example.org/path','https://user:secret@example.org','file:///tmp/','https://example.org/?x=1']) assert.throws(()=>deployment('production',{SITE_URL}));
 for(const BASE_PATH of ['anteprima','//bad/','/../','/demo','/a?b/']) assert.throws(()=>deployment('production',{BASE_PATH}));
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
