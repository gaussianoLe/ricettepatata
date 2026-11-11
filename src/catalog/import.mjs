import {parse} from 'csv-parse/sync';
import {z} from 'astro/zod';
import {mkdirSync,writeFileSync,realpathSync,lstatSync} from 'node:fs';
import path from 'node:path';
import {schemas} from './schema.mjs';
import {validateCatalog} from './validate.mjs';

export const csvColumns=['collection','schemaVersion','catalogId','slug','names','description','date','demo','editorial','sources','notes','externalIds','provenance','taxonomy','potatoRole','relation','duplicateOf','timing','servings','ingredients','steps','color','topics','relatedRecipeIds','body'];
const jsonColumns=new Set([
  'schemaVersion','demo','servings', // JSON scalars must retain their numeric/boolean/null types.
  'names','editorial','sources','notes','externalIds','provenance','taxonomy',
  'relation','timing','ingredients','steps','topics','relatedRecipeIds',
]);
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

export function stageImport(plan,directory,checkout=process.cwd(),artifacts={}) {
  const within=(parent,child)=>{
    const relative=path.relative(parent,child);
    return relative==='' || (!path.isAbsolute(relative) && relative!=='..' && !relative.startsWith('..'+path.sep));
  };
  const requested=path.resolve(directory),logicalRoot=path.resolve(checkout);
  const root=realpathSync(logicalRoot);
  // realpath resolves every existing ancestor, including symlinks outside the checkout.
  // The parent must already exist; never create intermediate paths through aliases.
  const output=path.join(realpathSync(path.dirname(requested)),path.basename(requested));
  if(within(logicalRoot,requested) || within(root,output)) throw new Error('Lo staging deve essere esterno al checkout anche nel percorso fisico');
  const additions=plan.additions.map(entry=>{
    if(!schemas[entry.collection]) throw new Error('Raccolta di staging sconosciuta');
    return {...entry,data:schemas[entry.collection].parse(entry.data)};
  });
  const documents=Object.entries(artifacts).map(([name,value])=>{
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(name) || name==='registry.json')throw new Error('Nome di artefatto staging non valido o riservato');
    const json=JSON.stringify(value,null,2);
    if(typeof json!=='string')throw new Error('Artefatto staging non serializzabile');
    return [name,json+'\n'];
  });
  const owned=new Map();
  const checkOwned=()=>{
    for(const [folder,identity] of owned) {
      const current=lstatSync(folder,{bigint:true});
      if(!current.isDirectory() || current.dev!==identity.dev || current.ino!==identity.ino || realpathSync(folder)!==folder) throw new Error('Directory di staging sostituita o collegata tramite symlink');
    }
  };
  const createDirectory=folder=>{
    checkOwned();
    mkdirSync(folder,{mode:0o700}); // Exclusive, including each child directory.
    owned.set(folder,lstatSync(folder,{bigint:true}));
    checkOwned();
  };
  createDirectory(output);
  // No recursive cleanup on failure: a replaced path must never delete someone else's data.
  // Partial staging is deliberately left for inspection, and every file uses exclusive creation.
  if(additions.length) createDirectory(path.join(output,'content'));
  for(const entry of additions) {
    const folder=path.join(output,'content',entry.collection);
    if(!owned.has(folder)) createDirectory(folder);
    const markdown=`---\n${JSON.stringify(entry.data,null,2)}\n---\n${entry.body}`;
    checkOwned();
    writeFileSync(path.join(folder,`${entry.data.slug}.md`),markdown,{flag:'wx',mode:0o600});
  }
  const registry=JSON.stringify(plan.registry,null,2)+'\n';
  checkOwned();
  writeFileSync(path.join(output,'registry.json'),registry,{flag:'wx',mode:0o600});
  for(const [name,json] of documents) {
    checkOwned();
    writeFileSync(path.join(output,name),json,{flag:'wx',mode:0o600});
  }
  return output;
}
