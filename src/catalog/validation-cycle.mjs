import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readCatalog,parseMarkdown} from './io.mjs';
import {validateCatalog} from './validate.mjs';
import {recipeSchema,sourceSchema} from './schema.mjs';
import {isVisible} from './policy.mjs';
import {stableJSON} from './research/input.mjs';
import {structuredDiff} from './enrichment-review.mjs';
const dir='docs/editorial/p1.8',sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>stableJSON(a)===stableJSON(b);
const must=(condition,message)=>{if(!condition)throw new Error(message);};
const read=file=>readFileSync(file);
export function validationInputs(){
 const json=file=>JSON.parse(read(file));
 return {baseline:json(dir+'/baseline.json'),amendments:json(dir+'/amendments.json'),sources:json(dir+'/sources.json'),dossiers:['RP-0011','RP-0062','RP-0080'].map(id=>json(`${dir}/dossiers/${id}.json`))};
}
/** Validate the entire current catalog before projecting the three archived files for historic checks. */
export function validateDraftRevisions(inputs,current,registry,readBytes=read){
 const {baseline,amendments,sources,dossiers}=inputs,parsed=validateCatalog(current,registry);
 must(baseline.baseCommit==='eb20683ad773882c88b06457c47642a42ea0d456' && amendments.baseCommit===baseline.baseCommit && amendments.mode==='manual-draft-revisions-no-upsert','Baseline/mandato P1.8 inatteso');
 const expectedIds=['RP-0011','RP-0062','RP-0080'];
 must(same(amendments.entries.map(a=>a.researchId).sort(),expectedIds) && same(dossiers.map(d=>d.researchId).sort(),expectedIds),'Il lotto deve contenere solo i tre draft autorizzati');
 const changes=new Map(amendments.entries.map(a=>[a.file,a]));must(changes.size===3,'Percorsi ripetuti');
 for(const [file,digest] of Object.entries(baseline.files)){
  must(!file.split('/').includes('..') && /^(docs\/(research\/lotto-01|editorial\/(first-ten|p1\.[467])|integration\/p1\.5)\/|src\/content\/|src\/catalog\/(registry\.json|schema\.mjs|policy\.mjs)$)/.test(file),'Percorso baseline inatteso');
  if(!changes.has(file))must(sha(readBytes(file))===digest,'Baseline protetta modificata: '+file);
 }
 must(same(parsed.map(e=>e.file).sort(),Object.keys(baseline.files).filter(f=>f.startsWith('src/content/')).sort()),'Aggiunta/ritiro/duplicato non autorizzato');
 must(same(registry,JSON.parse(readBytes('src/catalog/registry.json'))),'Registro attuale incoerente');
 for(const entry of parsed){const disk=parseMarkdown(readBytes(entry.file).toString('utf8'));must(same(entry.data,disk.data) && entry.body===disk.body,'Record corrente e disco discordanti');}
 const sourceById=new Map();
 for(const source of sources.sources){sourceSchema.parse(Object.fromEntries(['id','kind','title','url','author','accessedAt'].map(k=>[k,source[k]])));must(source.accessedAt==='2026-11-13' && source.consultedInP18===true && source.access==='full' && !sourceById.has(source.id),'Fonte non consultata o ripetuta');sourceById.set(source.id,source);}
 const archived=new Map(),diffs=[],results=[];
 for(const amendment of amendments.entries){
  must(amendment.file===`src/content/ricette/${amendment.slug}.md` && amendment.beforeFile===`${dir}/before/${amendment.slug}.md` && amendment.dossier===`${dir}/dossiers/${amendment.researchId}.json`,'Percorso revisione non conforme');
  must(amendment.authorization==='P1.8 request: sourced manual draft revision only' && amendment.state==='draft' && amendment.demo===false,'Mandato editoriale alterato');
  const beforeBytes=readBytes(amendment.beforeFile),afterBytes=readBytes(amendment.file);
  must(sha(beforeBytes)===amendment.beforeSha256 && baseline.files[amendment.file]===amendment.beforeSha256,'SHA precondizione/archivio non valido');
  must(sha(afterBytes)===amendment.afterSha256,'Modifica corrente non registrata nel piano P1.8');
  const before=parseMarkdown(beforeBytes.toString('utf8')),after=parseMarkdown(afterBytes.toString('utf8'));
  const data=recipeSchema.parse(after.data),old=recipeSchema.parse(before.data),entry=parsed.find(e=>e.data.catalogId===amendment.catalogId);
  must(entry && entry.file===amendment.file && same(entry.data,data) && entry.body===after.body,'Record corrente e disco discordanti');
  for(const key of ['catalogId','slug','names','externalIds','relation','demo','editorial','provenance','timing','servings','taxonomy','potatoRole','color'])must(same(data[key],old[key]),'Campo stabile/non autorizzato cambiato: '+key);
  must(data.catalogId===amendment.catalogId && data.slug===amendment.slug && data.editorial.status==='draft' && data.demo===false,'Identità o stato non preservati');
  const fields=[...new Set(structuredDiff(before.data,data).map(d=>d.path.split('/')[1]))];
  must(fields.every(f=>['description','date','sources','notes','ingredients','steps'].includes(f)) && same([...fields,'body'],amendment.changedFields),'Campi modificati estranei al piano');
  for(const ingredient of old.ingredients)must(same(data.ingredients.find(i=>i.id===ingredient.id),ingredient),'Dose/ingrediente originale alterato');
  const added=data.ingredients.filter(i=>!old.ingredients.some(o=>o.id===i.id));
  must(added.length===(amendment.researchId==='RP-0011'?1:0) && added.every(i=>i.id==='pangrattato-pirofila' && i.quantity.value===null && i.quantity.unit==='qb' && !i.optional),'Ingrediente o dose aggiunta senza riscontro');
  for(const source of old.sources)must(data.sources.some(s=>s.id===source.id && s.url===source.url && s.kind===source.kind && s.author===source.author),'Fonte storica rimossa o sostituita');
  for(const source of data.sources)must(sourceById.has(source.id) && ['id','url','author','kind','accessedAt','title'].every(f=>source[f]===sourceById.get(source.id)[f]),'Fonte operativa non coerente con la consultazione');
  for(const target of ['production','preview'])must(!isVisible(data,target),'Draft esposto pubblicamente');
  const dossier=dossiers.find(d=>d.researchId===amendment.researchId);
  must(dossier.catalogId===data.catalogId && dossier.slug===data.slug && dossier.file===amendment.file && dossier.catalogStatus==='draft' && dossier.demo===false && same(dossier.recordSourceIds,data.sources.map(s=>s.id)),'Dossier/identità discordanti');
  must(['ready_for_independent_review','needs_revision','blocked'].includes(dossier.outcome) && dossier.independentReview==='pending' && !dossier.kitchenTestPerformed && dossier.checklist.independentApproval===false,'Esito o verifica inventata');
  if(dossier.outcome==='ready_for_independent_review')must(dossier.essentialIssues.length===0 && dossier.checklist.essentialParametersResolved && dossier.checklist.timingReconciled,'Pronta con criticità essenziali irrisolte');
  else must(dossier.essentialIssues.length>0 && !dossier.checklist.essentialParametersResolved,'Esito non motivato');
  for(const claim of dossier.claims)must(claim.locator && claim.text && claim.sourceIds.length && claim.sourceIds.every(id=>sourceById.has(id)) && ['supported','unresolved','editorial-inference'].includes(claim.status),'Affermazione senza riscontro');
  archived.set(amendment.file,beforeBytes);
  diffs.push({researchId:amendment.researchId,file:amendment.file,beforeSha256:amendment.beforeSha256,afterSha256:amendment.afterSha256,changes:structuredDiff(before,after)});
  results.push({researchId:amendment.researchId,catalogId:data.catalogId,slug:data.slug,status:'draft',demo:false,outcome:dossier.outcome,file:amendment.file,beforeSha256:amendment.beforeSha256,afterSha256:amendment.afterSha256,essentialIssues:dossier.essentialIssues,openIssues:dossier.openIssues});
 }
 const readHistorical=file=>archived.get(file)??readBytes(file);
 const historicalEntries=parsed.map(entry=>archived.has(entry.file)?{...entry,...parseMarkdown(archived.get(entry.file).toString('utf8'))}:entry);
 return {historicalEntries,readHistorical,report:{formatVersion:1,baseCommit:baseline.baseCommit,summary:{revisedDrafts:3,readyForIndependentReview:results.filter(d=>d.outcome==='ready_for_independent_review').length,needsRevision:results.filter(d=>d.outcome==='needs_revision').length,blocked:results.filter(d=>d.outcome==='blocked').length,promoted:0,demoUpdates:0,registryUpdates:0,newIdentities:0},recipes:results,sources:{rechecked:10,added:3,total:sourceById.size,consultedAt:sources.consultedAt,dependentGroup:['ruggiero-gatto','gz-gatto']},historicalSnapshotsRewritten:false,currentCatalogValidated:true,protectedBaselineFiles:Object.keys(baseline.files).length,independentReview:'pending',kitchenTests:false,publicationAuthorized:false},diffs:{formatVersion:1,items:diffs}};
}
export function currentValidationState(current=readCatalog(),registry=JSON.parse(read('src/catalog/registry.json')),readBytes=read){return validateDraftRevisions(validationInputs(),current,registry,readBytes);}
/** Scan both archived and current record payloads so corrected prose/sources cannot evade privacy audits. */
export function draftAuditEntries(){
 const {amendments}=validationInputs(),catalog=readCatalog();
 return amendments.entries.flatMap(a=>[{collection:'ricette',file:a.beforeFile,...parseMarkdown(read(a.beforeFile).toString('utf8'))},catalog.find(e=>e.data.catalogId===a.catalogId)]);
}
