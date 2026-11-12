import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseMarkdown} from './io.mjs';
import {validateCatalog} from './validate.mjs';
import {recipeSchema,sourceSchema} from './schema.mjs';
import {isVisible} from './policy.mjs';
import {stableJSON} from './research/input.mjs';
const folder='docs/editorial/p1.6';
const same=(a,b)=>stableJSON(a)===stableJSON(b);
const requireThat=(condition,message)=>{if(!condition)throw new Error(message);};
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>readFileSync(file);
export function reviewInputs(){
 const json=file=>JSON.parse(read(file));
 return {baseline:json(folder+'/baseline.json'),plans:json('docs/editorial/p1.4/enrichments.json').plans,checklists:json('docs/integration/p1.5/enrichment-checklists.json').items,sources:json(folder+'/sources.json').sources,decisions:['RP-0001','RP-0039','RP-0079'].map(id=>json(`${folder}/${id}.json`))};
}
// Pure, read-only diff; JSON Pointer paths identify every changed leaf, including added/removed array items.
export function structuredDiff(before,after,pointer=''){
 if(same(before,after))return [];
 if(before && after && typeof before==='object' && typeof after==='object' && Array.isArray(before)===Array.isArray(after)){
  return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().flatMap(key=>{
   const next=pointer+'/'+key.replaceAll('~','~0').replaceAll('/','~1');
   if(!Object.hasOwn(before,key)||!Object.hasOwn(after,key))return [{path:next,before:{present:Object.hasOwn(before,key),...(Object.hasOwn(before,key)?{value:before[key]}:{})},after:{present:Object.hasOwn(after,key),...(Object.hasOwn(after,key)?{value:after[key]}:{})}}];
   return structuredDiff(before[key],after[key],next);
  });
 }
 return [{path:pointer,before:{present:true,value:before},after:{present:true,value:after}}];
}
export function replacementVisibility(current,proposed){
 const result=Object.fromEntries(['production','preview'].map(target=>[target,{before:isVisible(current,target),after:isVisible(proposed,target)}]));
 return {...result,regressesPreview:result.preview.before && !result.preview.after};
}
export function validateReview(inputs,entries,registry,readBytes=read){
 const {baseline,plans,checklists,sources,decisions}=inputs;
 requireThat(baseline.baseCommit==='f20de92df2a558de96f5aabe84ce8ccacf80ca20','Baseline P1.6 inattesa');
 const parsed=validateCatalog(entries,registry);
 for(const [file,hash] of Object.entries(baseline.files)){
  requireThat(/^(src\/content\/|src\/catalog\/registry\.json$|docs\/(research\/lotto-01|editorial\/(first-ten|p1\.4)|integration\/p1\.5)\/)/.test(file) && !file.split('/').includes('..'),'Percorso baseline non valido');
  requireThat(digest(readBytes(file))===hash,'Baseline storica/operativa modificata: '+file);
 }
 const protectedContent=Object.keys(baseline.files).filter(f=>f.startsWith('src/content/'));
 requireThat(same(parsed.map(e=>e.file).sort(),protectedContent.sort()),'Aggiunta, ritiro o duplicazione non autorizzata');
 for(const entry of parsed){
  const original=parseMarkdown(readBytes(entry.file).toString('utf8'));
  requireThat(same(entry.data,original.data) && entry.body===original.body,'Modifica operativa non autorizzata');
 }
 requireThat(same(registry,JSON.parse(readBytes('src/catalog/registry.json'))),'Registro corrente incoerente');
 const expectedIds=['RP-0001','RP-0039','RP-0079'];
 for(const list of [plans,checklists,decisions])requireThat(same(list.map(d=>d.researchId).sort(),expectedIds),'Selezione incompleta o duplicata');
 const sourceIds=new Set();
 for(const source of sources){sourceSchema.parse(source);requireThat(source.accessedAt==='2026-11-12' && !sourceIds.has(source.id),'Consultazione o fonte duplicata non conforme');sourceIds.add(source.id);}
 const diffs=[],results=[];
 for(const plan of plans){
  const decision=decisions.find(d=>d.researchId===plan.researchId),checklist=checklists.find(c=>c.researchId===plan.researchId);
  const current=parsed.find(e=>e.data.catalogId===plan.catalogId);
  requireThat(current && current.collection==='ricette' && current.data.slug===plan.slug && current.file===plan.targetPath,'UUID/slug/percorso non corrispondenti');
  requireThat(digest(readBytes(plan.targetPath))===plan.beforeSha256 && checklist.beforeSha256===plan.beforeSha256,'SHA di precondizione non corrispondente');
  for(const field of ['catalogId','slug','targetPath','beforeSha256'])requireThat(decision[field]===plan[field],'Identità/precondizione della decisione alterata');
  const proposed=recipeSchema.parse(plan.proposedRecord);
  requireThat(proposed.catalogId===current.data.catalogId && proposed.slug===current.data.slug && same(proposed.relation,current.data.relation),'Cambio identità, URL o relazione');
  requireThat(proposed.editorial.status==='candidate' && !proposed.demo && !proposed.editorial.publishedAt && !proposed.editorial.reviewedAt,'Promozione automatica non autorizzata');
  const visibility=replacementVisibility(current.data,proposed);
  requireThat(visibility.regressesPreview && !visibility.production.after && !visibility.preview.after,'Blocco di visibilità non riprodotto');
  requireThat(decision.status==='blocked' && decision.applied===false && decision.applicationApproved===false && decision.independentReview==='pending' && same(decision.allowedOperationalChanges,[]),'Applicazione/approvazione non autorizzata');
  requireThat(decision.proposedStatus==='candidate' && decision.visibility.regressesPreview===visibility.regressesPreview && decision.visibility.currentProduction===visibility.production.before && decision.visibility.currentPreview===visibility.preview.before && decision.visibility.proposedProduction===visibility.production.after && decision.visibility.proposedPreview===visibility.preview.after,'Decisione di visibilità discordante');
  requireThat(decision.formulaDecision.length>30 && decision.identityDecision.length>30 && decision.openIssues.length>=3 && decision.findings.length>=3,'Revisione incompleta');
  for(const claim of decision.findings)requireThat(claim.text && claim.locator && claim.sourceIds.length && claim.sourceIds.every(id=>sourceIds.has(id)),'Affermazione senza fonte consultata');
  requireThat(proposed.sources.every(s=>sourceIds.has(s.id)),'Formula non consultata');
  diffs.push({researchId:plan.researchId,catalogId:plan.catalogId,slug:plan.slug,targetPath:plan.targetPath,beforeSha256:plan.beforeSha256,proposalSha256:digest(stableJSON(proposed)),applied:false,bodyDisposition:'No replacement body supplied by P1.4; existing Markdown body unchanged. Future editing requires separate review.',changes:structuredDiff(current.data,proposed,'/data')});
  results.push({researchId:plan.researchId,catalogId:plan.catalogId,slug:plan.slug,status:decision.status,applied:false,applicationApproved:false,preconditionVerified:true,proposedStatus:proposed.editorial.status,formulaSourceIds:proposed.sources.map(s=>s.id),visibility,openIssues:decision.openIssues});
 }
 return {report:{formatVersion:1,baseCommit:baseline.baseCommit,summary:{reviewed:3,applied:0,prepared_not_applied:0,blocked:3,newIdentities:0,promotions:0},decisions:results,baseline:{filesChecked:Object.keys(baseline.files).length,sha256:digest(stableJSON(baseline)),p12ThroughP15Unchanged:true,currentCatalogValidated:true},modelChangeRequired:false,reason:'P1.1 candidate supports null timing; intervals and unknown durations remain in sourced findings. No operational replacement is authorized.',independentReview:'pending',mergeAuthorized:false,deploymentAuthorized:false},diffs:{formatVersion:1,applied:false,items:diffs}};
}
