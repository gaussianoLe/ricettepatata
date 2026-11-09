import {parse} from 'csv-parse/sync';
import {z} from 'astro/zod';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {schemas} from './schema.mjs';
import {validateCatalog} from './validate.mjs';

export const csvColumns=['collection','schemaVersion','catalogId','slug','names','description','date','demo','editorial','sources','notes','externalIds','provenance','taxonomy','potatoRole','relation','duplicateOf','timing','servings','ingredients','steps','color','topics','relatedRecipeIds','body'];
const jsonColumns=new Set(['schemaVersion','names','demo','editorial','sources','notes','externalIds','provenance','taxonomy','relation','timing','servings','ingredients','steps','topics','relatedRecipeIds']);
const envelope=z.strictObject({formatVersion:z.literal(1),entries:z.array(z.strictObject({collection:z.enum(['ricette','curiosita','guide']),data:z.unknown(),body:z.string().default('')}))});
export function parseImport(source,format) {
  if(format==='json') return envelope.parse(JSON.parse(source)).entries;
  if(format!=='csv') throw new Error('Formato richiesto: json oppure csv');
  const records=parse(source,{bom:true,skip_empty_lines:true,max_record_size:5_000_000,columns:header=>{
    if(new Set(header).size!==header.length || header.some(column=>!csvColumns.includes(column))) throw new Error('Intestazioni CSV duplicate o sconosciute');
    if(!header.includes('collection') || !header.includes('catalogId') || !header.includes('slug')) throw new Error('Intestazioni CSV obbligatorie mancanti');
    return header;
  }});
  return envelope.parse({formatVersion:1,entries:records.map(row=>{
    const {collection,body='',...fields}=row;
    const data=Object.fromEntries(Object.entries(fields).filter(([,value])=>value!=='').map(([key,value])=>[key,jsonColumns.has(key)?JSON.parse(value):value]));
    return {collection,data,body};
  })}).entries;
}

export function planImport(incoming,existing,registry) {
  const current=validateCatalog(existing,registry);
  const byId=new Map(current.map(entry=>[entry.data.catalogId,entry]));
  const nextRegistry=structuredClone(registry), additions=[];let skipped=0;
  for(const entry of incoming) {
    if(!schemas[entry.collection]) throw new Error(`Raccolta sconosciuta: ${entry.collection}`);
    const data=schemas[entry.collection].parse(entry.data);
    if(!['candidate','draft','review'].includes(data.editorial.status)) throw new Error('L’importazione non può verificare o pubblicare contenuti');
    const parsed={collection:entry.collection,data,body:entry.body??''};
    const previous=byId.get(data.catalogId);
    if(previous) {
      if(previous.collection!==parsed.collection || JSON.stringify(previous.data)!==JSON.stringify(data) || previous.body!==parsed.body) throw new Error(`Conflitto sul catalogId ${data.catalogId}: aggiornamento manuale richiesto`);
      skipped++;continue;
    }
    const identity=nextRegistry[data.catalogId];
    if(identity && (identity.collection!==parsed.collection || identity.slug!==data.slug)) throw new Error(`Identità riservata: ${data.catalogId}`);
    nextRegistry[data.catalogId]={collection:parsed.collection,slug:data.slug};
    byId.set(data.catalogId,parsed);additions.push(parsed);
  }
  validateCatalog([...current,...additions],nextRegistry);
  return {additions,skipped,registry:nextRegistry};
}

export function stageImport(plan,directory,checkout=process.cwd()) {
  const output=path.resolve(directory),root=path.resolve(checkout);
  if(output===root || output.startsWith(root+path.sep)) throw new Error('Lo staging deve essere esterno al checkout');
  mkdirSync(output); // Exclusive: never overwrite an existing directory.
  try {
    for(const entry of plan.additions) {
      const folder=path.join(output,'content',entry.collection);mkdirSync(folder,{recursive:true});
      writeFileSync(path.join(folder,`${entry.data.slug}.md`),`---\n${JSON.stringify(entry.data,null,2)}\n---\n${entry.body}`,{flag:'wx'});
    }
    writeFileSync(path.join(output,'registry.json'),JSON.stringify(plan.registry,null,2)+'\n',{flag:'wx'});
  } catch(error) {rmSync(output,{recursive:true});throw error;}
  return output;
}
