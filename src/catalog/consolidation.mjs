import {z} from 'astro/zod';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {sourceSchema,recipeSchema,ingredientSchema} from './schema.mjs';
import {validateCatalog} from './validate.mjs';
import {planImport} from './import.mjs';
import {stableJSON,researchId} from './research/input.mjs';
import {surveyNamespace} from './research/survey.mjs';
import {relatedNames,nameSignatures} from './research/matches.mjs';

const text=z.string().trim().min(1),date=z.iso.date(),uuid=z.uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const names=z.strictObject({italian:text,original:z.strictObject({text,language:text}),alternatives:z.array(z.strictObject({text,language:text}))});
const timing=z.strictObject({prepMinutes:z.number().int().nonnegative(),cookMinutes:z.number().int().nonnegative(),restMinutes:z.number().int().nonnegative()});
const step=z.strictObject({id:text,text,ingredientIds:z.array(text),minutes:z.number().nonnegative().optional()});
const formula=z.strictObject({sourceId:text,servings:z.number().positive().nullable(),ingredients:z.array(ingredientSchema),timing:timing.nullable(),steps:z.array(step),selectionRationale:text,timingBasis:text});
const claim=z.strictObject({field:text,text,sourceIds:z.array(text),status:z.enum(['supported','conflicting','unresolved','editorial-inference']),locator:text});
const dossierSchema=z.strictObject({
 formatVersion:z.literal(1),researchId:z.string().regex(/^RP-\d{4}$/),researchTechnicalId:uuid,researchLabel:text,proposedSlug:text,baselineDossier:text,
 names,provenance:z.strictObject({continent:text,country:z.strictObject({code:text,name:text}),region:text.nullable(),traditions:z.array(text)}),potatoRole:z.enum(['protagonist','secondary']).nullable(),
 sourceIds:z.array(text),claims:z.array(claim).min(1),formula:formula.nullable(),identity:z.strictObject({existingCatalogId:uuid.nullable(),operationalSlug:text.nullable(),relation:z.enum(['primary','same-recipe-enrichment']),rationale:text}),
 decision:z.strictObject({outcome:z.enum(['needs_review','enrichment-proposal','new-draft','retained-draft']),proposedStatus:z.enum(['candidate','draft']),reason:text}),openQuestions:z.array(text).min(1),changesFromP13:z.array(text).min(1),
});
const entry=z.strictObject({collection:z.literal('ricette'),data:recipeSchema,body:z.string()});
const source=sourceSchema.extend({independenceGroup:text,assessment:text,access:z.enum(['full','partial-paywall']),consultedInP14:z.boolean(),derivedFrom:z.array(text),role:z.enum(['recipe-or-context','context-only','food-safety','cleaning-only'])});
const planSchema=z.strictObject({researchId:text,catalogId:uuid,slug:text,targetPath:text,beforeSha256:hash,disposition:z.literal('same-recipe-enrichment'),requiresIndependentReview:z.literal(true),application:z.literal('manual-only'),fieldChanges:z.array(z.strictObject({field:text,before:z.unknown(),after:z.unknown()})),proposedRecord:recipeSchema});
export const sha256=value=>createHash('sha256').update(value).digest('hex');
const same=(a,b)=>stableJSON(a)===stableJSON(b);
const unique=(values,label)=>{if(new Set(values).size!==values.length)throw new Error('Duplicati: '+label);};
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const filesBelow=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(item=>item.isDirectory()?filesBelow(path.join(folder,item.name)):[path.join(folder,item.name).replaceAll('\\','/')]);

export function readConsolidation(root='docs/editorial/p1.4'){
 const read=file=>JSON.parse(readFileSync(path.join(root,file),'utf8'));
 const inputs=['baseline.json','selection.json','sources.json','search-log.json','records.json','enrichments.json',...readdirSync(path.join(root,'dossiers')).filter(f=>f.endsWith('.json')).sort().map(f=>'dossiers/'+f)];
 return {baseline:read('baseline.json'),selection:read('selection.json'),sources:read('sources.json'),dossiers:inputs.filter(f=>f.startsWith('dossiers/')).map(read),records:read('records.json'),enrichments:read('enrichments.json'),inputHashes:Object.fromEntries(inputs.map(f=>[f,sha256(readFileSync(path.join(root,f)))]))};
}

export function verifyHistoricalBaseline(manifest,readBytes=file=>readFileSync(file)){
 const parsed=z.strictObject({commit:z.literal('2a85624b03d84e7b462f381d7e854a09e7e5ecdf'),files:z.record(text,hash)}).parse(manifest);
 for(const [file,digest] of Object.entries(parsed.files)){
  assert(/^(?:docs\/(?:editorial\/first-ten|research\/lotto-01)\/[^.][^]*|src\/content\/[^]+\.md|src\/catalog\/registry\.json)$/.test(file) && !file.split('/').includes('..'),'Percorso baseline non consentito');
  assert(sha256(readBytes(file))===digest,'Baseline storica modificata: '+file);
 }
 for(const folder of ['docs/editorial/first-ten','docs/research/lotto-01']){
  for(const file of filesBelow(folder))assert(Object.hasOwn(parsed.files,file),'File estraneo alla baseline: '+file);
 }
 return parsed;
}

function checkFormula(record,dossier,sources){
 const f=dossier.formula;assert(f,'Formula mancante');
 for(const key of ['ingredients','steps','timing','servings'])assert(same(record[key],f[key]),'Formula/record discordanti: '+key);
 assert(same(record.names,dossier.names) && same(record.provenance,dossier.provenance) && record.potatoRole===dossier.potatoRole,'Dossier/record discordanti');
 const primary=sources.get(f.sourceId);
 assert(primary?.access==='full' && primary.kind!=='internal' && primary.consultedInP14 && primary.role==='recipe-or-context','Formula non consultata integralmente in P1.4');
 assert(dossier.sourceIds.includes(f.sourceId),'Formula senza riferimento nel dossier');
 assert(record.sources.some(s=>s.id===f.sourceId),'Fonte della formula mancante nel record');
 for(const s of record.sources){const ref=sources.get(s.id);assert(ref && dossier.sourceIds.includes(s.id) && Object.keys(s).every(k=>s[k]===ref[k]),'Metadati fonte discordanti');}
 assert(record.sources.length===dossier.sourceIds.length,'Fonti record incomplete');
 assert(['candidate','draft'].includes(record.editorial.status) && !record.demo && !record.editorial.reviewer && !record.editorial.reviewedAt && !record.editorial.publishedAt,'Promozione editoriale non autorizzata');
}

// Validates consistency and produces a read-only plan. It never applies an update or writes content.
export function validateConsolidation(bundle,baselineBundle,existing,registry,readBytes=file=>readFileSync(file)){
 verifyHistoricalBaseline(bundle.baseline,readBytes);
 const selection=z.strictObject({formatVersion:z.literal(1),baseCommit:z.literal('2a85624b03d84e7b462f381d7e854a09e7e5ecdf'),consultedAt:date,researchIds:z.array(text).min(1)}).parse(bundle.selection);
 const sourceFile=z.strictObject({formatVersion:z.literal(1),consultedAt:date,sources:z.array(source)}).parse(bundle.sources);
 const sources=new Map(sourceFile.sources.map(s=>[s.id,s]));unique(sourceFile.sources.map(s=>s.id),'fonti');
 assert(sourceFile.consultedAt===selection.consultedAt,'Data P1.4 discordante');
 for(const s of sourceFile.sources){
  if(s.consultedInP14)assert(s.accessedAt===selection.consultedAt && s.access==='full','Consultazione P1.4 discordante');
  for(const parent of s.derivedFrom)assert(parent!==s.id && sources.has(parent) && sources.get(parent).independenceGroup===s.independenceGroup,'Dipendenza bibliografica non dichiarata correttamente');
 }
 const previousSources=new Map(baselineBundle.sources.sources.map(s=>[s.id,s]));
 for(const [id,old] of previousSources){const current=sources.get(id);assert(current && Object.keys(old).every(k=>same(current[k],old[k])),'Fonte P1.3 alterata senza una nuova edizione');}
 const dossiers=bundle.dossiers.map(d=>dossierSchema.parse(d));unique(dossiers.map(d=>d.researchId),'dossier');unique(selection.researchIds,'selezione');
 assert(same([...selection.researchIds].sort(),baselineBundle.selection.sourceIds.slice().sort()) && same(dossiers.map(d=>d.researchId).sort(),selection.researchIds.slice().sort()),'Selezione diversa da P1.3');
 const records=z.strictObject({formatVersion:z.literal(1),entries:z.array(entry)}).parse(bundle.records).entries;
 const plans=z.strictObject({formatVersion:z.literal(1),plans:z.array(planSchema)}).parse(bundle.enrichments).plans;
 const researchKey=data=>{const ids=data.externalIds.filter(id=>id.namespace===surveyNamespace);assert(ids.length===1,'ID ricerca mancante');return ids[0].value;};
 const recordsById=new Map(records.map(e=>[researchKey(e.data),e.data]));unique(records.map(e=>researchKey(e.data)),'record');
 const plansById=new Map(plans.map(p=>[p.researchId,p]));unique(plans.map(p=>p.researchId),'proposte');
 const oldById=new Map(baselineBundle.dossiers.map(d=>[d.researchId,d]));
 const current=validateCatalog(existing,registry),checks=[];
 for(const d of dossiers){
  const old=oldById.get(d.researchId);
  assert(old && d.researchTechnicalId===old.researchTechnicalId && d.researchTechnicalId===researchId(surveyNamespace,d.researchId) && d.researchLabel===old.researchLabel && d.proposedSlug===old.proposedSlug && d.baselineDossier===`docs/editorial/first-ten/dossiers/${d.researchId}.json`,'Identità di ricerca alterata');
  unique(d.sourceIds,'fonti dossier');assert(d.sourceIds.length>0,'Dossier senza fonti o riferimenti contestuali');
  for(const id of d.sourceIds)assert(sources.has(id),'Fonte inesistente');
  for(const c of d.claims){
   unique(c.sourceIds,'citazioni');if(['supported','conflicting'].includes(c.status))assert(c.sourceIds.length>0,'Affermazione senza fonte');
   for(const id of c.sourceIds)assert(d.sourceIds.includes(id),'Citazione estranea al dossier');
  }
  if(d.formula)assert(d.sourceIds.includes(d.formula.sourceId),'Formula estranea al dossier');
  const outcome=d.decision.outcome,record=recordsById.get(d.researchId),plan=plansById.get(d.researchId);
  const owner=Object.entries(registry).find(([,r])=>r.collection==='ricette' && r.slug===d.proposedSlug)?.[0]??null;
  const matches=current.filter(e=>e.collection==='ricette' && relatedNames(nameSignatures({names:d.names}),nameSignatures(e.data))).map(e=>e.data.catalogId);
  if(['new-draft','retained-draft'].includes(outcome)){
   assert(d.decision.proposedStatus==='draft' && record && !plan,'Draft mancante o proposta inattesa');
   assert(!d.identity.existingCatalogId && !d.identity.operationalSlug && d.identity.relation==='primary' && !owner && !matches.length,'Collisione o identità esistente: niente nuova identità');
   assert(record.catalogId===d.researchTechnicalId && record.slug===d.proposedSlug && record.editorial.status==='draft' && record.relation.kind==='primary' && !record.duplicateOf,'Identità/stato draft alterati');
   const wasDraft=baselineBundle.records.entries.some(e=>researchKey(e.data)===d.researchId);
   assert(wasDraft===(outcome==='retained-draft'),'Classificazione nuovo draft discordante dalla baseline');
   const groups=new Set(d.sourceIds.filter(id=>sources.get(id).role==='recipe-or-context' && sources.get(id).access==='full').map(id=>sources.get(id).independenceGroup));
   assert(groups.size>=2,'Riscontri indipendenti insufficienti');
   checkFormula(record,d,sources);
  }else if(outcome==='enrichment-proposal'){
   assert(d.decision.proposedStatus==='candidate' && plan && !record,'Proposta mancante o conversione indebita');
   const before=current.find(e=>e.data.catalogId===d.identity.existingCatalogId)?.data;
   assert(before && plan.catalogId===before.catalogId && plan.slug===before.slug && d.identity.operationalSlug===before.slug && d.identity.relation==='same-recipe-enrichment' && d.identity.existingCatalogId===old.identity.existingCatalogId,'Identità operativa non preservata');
   assert(plan.targetPath===`src/content/ricette/${before.slug}.md` && sha256(readBytes(plan.targetPath))===plan.beforeSha256,'Base proposta modificata');
   assert(!owner || owner===before.catalogId,'Slug riservato estraneo');
   const after=plan.proposedRecord;
   assert(after.catalogId===before.catalogId && after.slug===before.slug && after.relation.kind===before.relation.kind && !after.duplicateOf && researchKey(after)===d.researchId && after.editorial.status==='candidate','Upsert o nuova identità non consentiti');
   checkFormula(after,d,sources);
   const expected=Object.entries(after).filter(([k,v])=>!same(before[k],v)).map(([field,after])=>({field,before:before[field],after}));
   assert(same(expected,plan.fieldChanges) && plan.fieldChanges.length>0,'Differenze proposta obsolete');
  }else{
   assert(d.decision.proposedStatus==='candidate' && !record && !plan && d.identity.existingCatalogId===old.identity.existingCatalogId,'Conversione di caso bloccato');
  }
  checks.push({researchId:d.researchId,outcome,technicalId:d.researchTechnicalId,existingCatalogId:d.identity.existingCatalogId,reservedSlugOwner:owner,possibleMatches:matches});
 }
 assert(records.length===dossiers.filter(d=>['new-draft','retained-draft'].includes(d.decision.outcome)).length && plans.length===dossiers.filter(d=>d.decision.outcome==='enrichment-proposal').length,'Output estraneo ai dossier');
 const additions=planImport(records,current,registry);
 const draftFields=dossiers.filter(d=>['new-draft','retained-draft'].includes(d.decision.outcome));
 return {formatVersion:1,baseCommit:selection.baseCommit,consultedAt:selection.consultedAt,inputHashes:bundle.inputHashes,summary:{assessed:dossiers.length,consolidated:draftFields.length+plans.length,newDrafts:dossiers.filter(d=>d.decision.outcome==='new-draft').length,retainedDrafts:dossiers.filter(d=>d.decision.outcome==='retained-draft').length,enrichmentProposals:plans.length,blocked:dossiers.filter(d=>d.decision.outcome==='needs_review').length,addedSources:sourceFile.sources.filter(s=>!previousSources.has(s.id)).length,reconsultedSources:sourceFile.sources.filter(s=>previousSources.has(s.id) && s.consultedInP14).length},identityChecks:checks,plan:{newCatalogEntriesIfApproved:additions.additions.length,skipped:additions.skipped,updatesApplied:0},baselineUnchanged:true,sourceContentChanged:false,registryChanged:false,appliedToAstro:false,publicationAuthorized:false,catalogFingerprint:sha256(stableJSON({entries:current.map(e=>({collection:e.collection,data:e.data})).sort((a,b)=>a.data.catalogId.localeCompare(b.data.catalogId)),registry})),limitations:['Consolidated include draft e proposte complete; non equivale a verified o pubblicazione.','Nessuna applicazione dei draft o dei piani; nessun upsert introdotto.','Prove in cucina e review indipendente restano necessarie.']};
}

export function renderConsolidationMatrix(bundle){
 const sources=new Map(bundle.sources.sources.map(s=>[s.id,s]));
 const cell=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
 return '# P1.4 — Matrice fonti e affermazioni\n\nConsultazione P1.4: '+bundle.selection.consultedAt+'. Fonti ereditate non riaperte conservano le consultazioni P1.3. Riscontro documentale e inferenza non sono stati editoriali verified.\n\n| Ricerca | Campo | Stato | Riscontro / limite | Fonti e sezione |\n| --- | --- | --- | --- | --- |\n'+bundle.dossiers.flatMap(d=>d.claims.map(c=>'| '+[d.researchId,c.field,c.status,c.text,c.sourceIds.map(id=>`[${id}](${sources.get(id).url})`).join(', ')+' — '+c.locator].map(cell).join(' | ')+' |')).join('\n')+'\n';
}
