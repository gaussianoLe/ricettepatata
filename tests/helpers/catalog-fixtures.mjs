import {readFileSync,writeFileSync,existsSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readEntries,readCatalog} from '../../src/catalog/io.mjs';

const manifest='.astro/p1-catalog-fixtures.json', registryPath='src/catalog/registry.json';
export function addFixtures() {
  if(existsSync(manifest)) throw new Error('Fixture già presenti');
  const registryText=readFileSync(registryPath,'utf8'), registry=JSON.parse(registryText), files=[];
  const original=readEntries();
  const add=(collection,data)=>{
    // Deliberately differ from the slug to exercise filename-independent URLs.
    const file=`src/content/${collection}/storage-${data.slug}.md`;
    writeFileSync(file,`---\n${JSON.stringify(data,null,2)}\n---\nTEST ONLY — fixture sintetica, non contenuto editoriale.\n`,{flag:'wx'});
    files.push(file);registry[data.catalogId]={collection,slug:data.slug};return data;
  };
  const recipe=original.find(entry=>entry.collection==='ricette' && entry.data.slug==='rosti').data;
  const verified=(record,status)=>({...structuredClone(record),catalogId:randomUUID(),slug:`ci-${status}`,demo:false,editorial:{status,author:'CI synthetic author',...(['verified','published'].includes(status)?{reviewer:'CI synthetic reviewer',reviewedAt:'2026-11-09'}:{}),...(status==='published'?{publishedAt:'2026-11-09'}:{})},sources:[{id:'test-source',kind:'secondary',url:'https://example.org/test-only',title:'TEST ONLY',author:'Synthetic fixture',accessedAt:'2026-11-09'}]});
  try {
    let primary;
    for(const status of ['candidate','draft','review','verified','published']) {
      const data=verified(recipe,status);
      if(status==='candidate'){data.timing=null;data.servings=null;data.ingredients=[];data.steps=[];}
      const added=add('ricette',data);if(status==='published')primary=added;
    }
    add('ricette',{...verified(recipe,'published'),slug:'ci-regional-variant',relation:{kind:'variant',primaryId:primary.catalogId}});
    add('ricette',{...verified(recipe,'candidate'),slug:'ci-duplicate',duplicateOf:primary.catalogId});
    for(const collection of ['curiosita','guide']) {
      const source=original.find(entry=>entry.collection===collection).data;
      const data=verified(source,'published');data.relatedRecipeIds=[primary.catalogId];add(collection,data);
    }
    writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n');
    readCatalog();writeFileSync(manifest,JSON.stringify({files,registryText}));
    console.log(`Aggiunte ${files.length} fixture sintetiche; mai incluse nel commit o distribuite.`);
  } catch(error){for(const file of files)unlinkSync(file);writeFileSync(registryPath,registryText);throw error;}
}
export function removeFixtures() {
  if(!existsSync(manifest))return;
  const {files,registryText}=JSON.parse(readFileSync(manifest,'utf8'));
  for(const file of files)unlinkSync(file);
  writeFileSync(registryPath,registryText);unlinkSync(manifest);
  console.log('Fixture rimosse e registro ripristinato.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 if(process.argv[2]==='add')addFixtures();
 else if(process.argv[2]==='remove')removeFixtures();
 else throw new Error('Usare add oppure remove');
}
