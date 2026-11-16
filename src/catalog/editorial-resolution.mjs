import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readCatalog,parseMarkdown} from './io.mjs';
import {validateCatalog} from './validate.mjs';
import {recipeSchema,sourceSchema} from './schema.mjs';
import {isVisible} from './policy.mjs';
import {structuredDiff} from './enrichment-review.mjs';
import {stableJSON} from './research/input.mjs';
const dir='docs/editorial/p1.9';
const same=(a,b)=>stableJSON(a)===stableJSON(b),sha=b=>createHash('sha256').update(b).digest('hex');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
export function resolutionInputs(){
 const json=file=>JSON.parse(readFileSync(file));
 return {baseline:json(dir+'/baseline.json'),plan:json(dir+'/plan.json'),sources:json(dir+'/sources.json'),comparison:json(dir+'/formula-comparison.json'),alternative:json(dir+'/alternative.json'),dossiers:['RP-0011','RP-0062','RP-0080'].map(id=>json(`${dir}/dossiers/${id}.json`))};
}
export function validateResolution(inputs,current,registry,read=file=>readFileSync(file)){
 const {baseline,plan,sources,comparison,alternative,dossiers}=inputs;
 assert(baseline.baseCommit==='621233dae580cd9e393441be756266192d2bae76' && plan.baseCommit===baseline.baseCommit,'Baseline P1.9 non conforme');
 assert(plan.operationalChanges===0 && same(plan.operationalWritesAuthorized,[]) && plan.requireIndependentReview===true && plan.mergeAuthorized===false && plan.deploymentAuthorized===false,'Scrittura o autorizzazione non prevista');
 for(const [file,digest] of Object.entries(baseline.files)){
  assert(!file.split('/').includes('..') && /^(src\/(content|catalog)\/|docs\/(research\/lotto-01|editorial\/(first-ten|p1\.[4678])|integration\/p1\.5)\/)/.test(file),'Percorso baseline non valido');
  assert(sha(read(file))===digest,'File operativo/storico modificato senza mandato: '+file);
 }
 const parsed=validateCatalog(current,registry);
 assert(same(parsed.map(e=>e.file).sort(),Object.keys(baseline.files).filter(f=>f.startsWith('src/content/')).sort()),'Aggiunte/ritiri non autorizzati');
 assert(same(registry,JSON.parse(read('src/catalog/registry.json'))),'Registro discordante');
 for(const entry of parsed){const disk=parseMarkdown(read(entry.file).toString('utf8'));assert(same(entry.data,disk.data)&&entry.body===disk.body,'Record in memoria diverso dal file');}
 const sourcesById=new Map();
 for(const s of sources.sources){sourceSchema.parse(Object.fromEntries(['id','kind','title','url','author','accessedAt'].map(k=>[k,s[k]])));assert(s.accessedAt==='2026-11-16'&&s.consultedInP19===true&&s.access==='full'&&!sourcesById.has(s.id)&&!sources.limitations.some(f=>f.url===s.url),'Consultazione non conforme');sourcesById.set(s.id,s);}
 assert(same(comparison.items.map(i=>i.sourceId).sort(),['alpes-gratin','atelier-gratin','eurial-gratin','laruelle-gratin']),'Confronto delle quattro fonti incompleto');
 for(const item of comparison.items){assert(sourcesById.has(item.sourceId),'Fonte non consultata');assert(item.panFootprintCm===null && item.panWallDepthCm===null && item.oven.mode===null,'Geometria o modalità inventata per le quattro fonti');}
 const eurial=comparison.items.find(i=>i.sourceId==='eurial-gratin');assert(eurial.sliceMm===null && eurial.precook.intensity===null && eurial.precook.minutes===20 && eurial.oven.celsius===200 && eurial.oven.minutes===15,'Eurial alterata o completata senza fonte');
 assert(plan.proposal.file===dir+'/alternative.json' && plan.proposal.status==='prepared_not_applied','Destinazione proposta non valida');
 assert(sha(read(plan.proposal.file))===plan.proposal.sha256 && same(JSON.parse(read(plan.proposal.file)),alternative),'Proposta alterata rispetto al piano');
 assert(alternative.status==='prepared_not_applied'&&!alternative.applicationApproved&&!alternative.kitchenTestPerformed&&alternative.independentReview==='pending'&&alternative.singleSourceFormula===true&&alternative.sourceId==='merrett-dauphinoise','Proposta impropriamente applicata/approvata');
 const record=recipeSchema.parse(alternative.entry.data),live=parsed.find(e=>e.data.catalogId===record.catalogId);
 assert(live && live.data.slug==='gratin-dauphinois' && record.slug===live.data.slug && same(record.externalIds,live.data.externalIds) && same(record.relation,live.data.relation),'Identità/slug/relazioni della proposta diversi dal catalogo');
 assert(alternative.targetPath===live.file && alternative.targetResearchId==='RP-0062' && alternative.currentSha256===sha(read(live.file)),'Precondizione proposta fallita');
 assert(record.demo===false && record.editorial.status==='candidate'&&!record.editorial.reviewer&&!record.editorial.reviewedAt&&!record.editorial.publishedAt,'Promozione editoriale inventata');
 assert(record.sources.length===1 && record.sources[0].id===alternative.sourceId && sourcesById.has(record.sources[0].id),'Formula assemblata da più fonti');
 for(const key of ['id','title','author','url','kind','accessedAt'])assert(record.sources[0][key]===sourcesById.get(alternative.sourceId)[key],'Fonte proposta discordante');
 assert(alternative.parameters.panFootprintCm===null && alternative.parameters.panWallDepthCm===null && alternative.parameters.fullyDeterminedGeometry===false && same(alternative.parameters.foodLayerDepthCm,{value:5,approximate:true}),'Strato del cibo trasformato in altezza della pirofila');
 assert(record.timing===null && alternative.parameters.optionalBrowning.newCelsius===null && alternative.openIssues.length>=4,'Parametri mancanti trasformati in valori inventati');
 assert(record.ingredients.find(i=>i.id==='patata').quantity.unit==='piece' && record.ingredients.find(i=>i.id==='patata').quantity.value===8 && record.ingredients.find(i=>i.id==='gruyere').optional===true,'Formula Merrett modificata');
 validateCatalog(parsed.map(e=>e===live?{...e,data:record,body:alternative.entry.body}:e),registry); // Validation in memory only; no writer.
 for(const target of ['production','preview']){assert(!isVisible(record,target),'Proposta pubblica');for(const e of parsed.filter(e=>!e.data.demo&&e.collection==='ricette'&&e.data.editorial.status==='draft'))assert(!isVisible(e.data,target),'Draft reale esposto');}
 assert(same(dossiers.map(d=>d.researchId).sort(),['RP-0011','RP-0062','RP-0080']),'Selezione dossier errata');
 const diffItems=[],results=[];
 const required={'RP-0011':['doses-yield','pan-lining','time-budget','food-safety'],'RP-0080':['water-salt','drying','mojo-scope','allergens'],'RP-0062':['slice-thickness','pan-geometry','precook','oven-mode','compatibility','alternative']};
 for(const d of dossiers){
  const entry=parsed.find(e=>e.data.catalogId===d.catalogId),hash=sha(read(d.file));
  assert(entry && entry.file===d.file && entry.data.slug===d.slug && entry.data.editorial.status==='draft' && entry.data.demo===false,'Identità o stato dossier non conformi');
  assert(d.operationalChanges===0&&d.beforeSha256===hash&&d.afterSha256===hash&&d.operationalSha256===hash,'SHA prima/dopo discordanti');
  assert(d.secondDocumentaryReviewCompleted===true&&!d.kitchenTestPerformed&&d.independentReview==='pending'&&d.independentApproval===false,'Review o cucina dichiarata senza esecuzione');
  assert(same(d.checklist.map(i=>i.id).sort(),required[d.researchId].slice().sort()),'Checklist incompleta o duplicata');
  for(const c of d.checklist)assert(c.checked===true&&c.finding&&c.locator&&c.sourceIds.length&&c.sourceIds.every(id=>sourcesById.has(id))&&['documented','documented_limit','unresolved','prepared_not_applied'].includes(c.result),'Voce non esaminata o senza fonte');
  assert(d.pendingApprovals.includes('review-indipendente'),'Approvazione non mantenuta pendente');
  if(d.researchId==='RP-0062')assert(d.outcome==='needs_revision'&&d.essentialIssues.length>0&&d.checklist.filter(c=>c.result==='unresolved').length===5,'Gratin dichiarato risolto senza evidenze');
  else assert(d.outcome==='ready_for_independent_review'&&d.essentialIssues.length===0,'Esito dei dossier non coerente');
  diffItems.push({researchId:d.researchId,file:d.file,beforeSha256:hash,afterSha256:hash,changes:[]});
  results.push({researchId:d.researchId,catalogId:d.catalogId,slug:d.slug,outcome:d.outcome,operationalChanges:0,status:'draft',demo:false,essentialIssues:d.essentialIssues,openIssues:d.openIssues,checklistReviewed:d.checklist.length,independentApproval:false});
 }
 return {report:{formatVersion:1,baseCommit:baseline.baseCommit,summary:{reviewed:3,readyForIndependentReview:2,needsRevision:1,operationalChanges:0,proposalsPrepared:1,proposalsApplied:0,promotions:0,newIdentities:0},recipes:results,alternative:{status:alternative.status,sourceId:alternative.sourceId,fullyDeterminedGeometry:false,applicationApproved:false,openIssues:alternative.openIssues},sources:{consultedAt:sources.consultedAt,consulted:sourcesById.size,failedAttempts:sources.limitations},baseline:{filesChecked:Object.keys(baseline.files).length,allHashesUnchanged:true,p12ThroughP18Preserved:true},kitchenTests:false,independentReview:'pending',publicationAuthorized:false},diffs:{formatVersion:1,operational:diffItems,unappliedAlternative:{target:live.file,sourceId:alternative.sourceId,currentSha256:alternative.currentSha256,proposalSha256:plan.proposal.sha256,applied:false,changes:structuredDiff({data:live.data,body:live.body},{data:record,body:alternative.entry.body})}}};
}
export function currentResolution(){return validateResolution(resolutionInputs(),readCatalog(),JSON.parse(readFileSync('src/catalog/registry.json')));}
