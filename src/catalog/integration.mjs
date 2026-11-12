import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync,brotliDecompressSync} from 'node:zlib';
import path from 'node:path';
import {parseImport,planImport} from './import.mjs';
import {validateCatalog} from './validate.mjs';
import {parseMarkdown} from './io.mjs';
import {isVisible} from './policy.mjs';
import {historicalCatalog} from './history.mjs';
import {stableJSON} from './research/input.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const same=(a,b)=>stableJSON(a)===stableJSON(b);
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const root='docs/integration/p1.5';
export function integrationInputs(){
 const historical=historicalCatalog();
 const entries=parseImport(readFileSync('docs/editorial/p1.4/records.json','utf8'),'json');
 const plan=JSON.parse(readFileSync(root+'/plan.json','utf8'));
 const proposals=JSON.parse(readFileSync('docs/editorial/p1.4/enrichments.json','utf8')).plans;
 return {historical,entries,plan,proposals};
}
export function validateIntegration(inputs,current,registry,readBytes=file=>readFileSync(file)){
 const {historical,entries,plan,proposals}=inputs;
 const before=historical.snapshot;
 assert(plan.baseCommit===before.baseCommit && plan.source==='docs/editorial/p1.4/records.json' && sha(readBytes(plan.source))===plan.sourceSha256 && plan.baselineRegistrySha256===before.files['src/catalog/registry.json'],'Piano di provenienza modificato');
 assert(entries.length===3 && plan.additions.length===3 && plan.skipped===0 && plan.enrichmentsApplied===0,'Il lotto autorizzato deve contenere esattamente tre draft');
 const initial=planImport(entries,historical.entries,historical.registry);
 assert(initial.additions.length===3 && initial.skipped===0,'Collisione o duplicazione nella baseline');
 const parsed=validateCatalog(current,registry),newIds=new Set(entries.map(e=>e.data.catalogId));
 assert(newIds.size===3,'Identità ripetute');
 assert(parsed.length===historical.entries.length+3,'Aggiunte/ritiri estranei al lotto');
 const expectedRegistry=initial.registry;
 assert(same(registry,expectedRegistry),'Registro diverso dalle sole tre registrazioni autorizzate');
 const byId=new Map(parsed.map(e=>[e.data.catalogId,e]));
 const integrated=[];
 for(const source of entries){
  const data=source.data,currentEntry=byId.get(data.catalogId);
  const researchId=data.externalIds.find(id=>id.namespace==='ricettepatata-exploratory-census')?.value;
  const addition=plan.additions.find(a=>a.catalogId===data.catalogId);
  assert(addition && addition.slug===data.slug && addition.researchId===researchId && addition.status==='draft' && same(addition.sourceIds,data.sources.map(s=>s.id)) && addition.targetPath===`src/content/ricette/${data.slug}.md`,'Identità o percorso del piano alterati');
  assert(currentEntry && currentEntry.file===addition.targetPath && same(currentEntry.data,data) && currentEntry.body===source.body,'Record operativo diverso dalla fonte P1.4');
  assert(data.editorial.status==='draft' && !data.demo && !data.editorial.reviewer && !data.editorial.reviewedAt && !data.editorial.publishedAt,'Promozione editoriale non autorizzata');
  assert(!Object.hasOwn(historical.registry,data.catalogId),'Identità già operativa nella baseline');
  const disk=parseMarkdown(readBytes(addition.targetPath).toString('utf8'));
  assert(same(disk.data,data) && disk.body===source.body,'File operativo non identico al record P1.4');
  const staged=plan.staging.files.find(f=>f.path===`content/ricette/${data.slug}.md`);
  assert(staged && sha(readBytes(addition.targetPath))===staged.sha256,'File diverso dal piano di staging');
  const dossier=JSON.parse(readBytes(`docs/editorial/p1.4/dossiers/${researchId}.json`));
  assert(dossier.researchTechnicalId===data.catalogId && dossier.proposedSlug===data.slug && ['new-draft','retained-draft'].includes(dossier.decision.outcome),'Dossier non autorizza questo draft');
  for(const field of ['ingredients','timing','servings','steps'])assert(same(data[field],dossier.formula[field]),'Formula operativa discordante: '+field);
  const visibility=Object.fromEntries(['production','preview'].map(target=>[target,isVisible(data,target)]));
  assert(!Object.values(visibility).some(Boolean),'Draft esposto in un target pubblico');
  integrated.push({researchId,catalogId:data.catalogId,slug:data.slug,file:addition.targetPath,fileSha256:sha(readBytes(addition.targetPath)),status:'draft',sourceArtifact:plan.source,dossier:`docs/editorial/p1.4/dossiers/${researchId}.json`,formulaSourceId:dossier.formula.sourceId,sourceIds:data.sources.map(s=>s.id),visibility});
 }
 for(const old of historical.entries){
  const now=byId.get(old.data.catalogId);
  assert(now && same(now.data,old.data) && now.body===old.body,'Contenuto preesistente modificato');
 }
 const repeated=planImport(entries,parsed,registry);
 assert(repeated.additions.length===0 && repeated.skipped===3,'L’importazione ripetuta non è idempotente');
 const enrichments=proposals.map(p=>{
  assert(Object.hasOwn(historical.registry,p.catalogId) && registry[p.catalogId].slug===p.slug && sha(readBytes(p.targetPath))===p.beforeSha256,'Precondizione arricchimento fallita');
  const checklist=JSON.parse(readBytes(root+'/enrichment-checklists.json')).items.find(c=>c.researchId===p.researchId);
  assert(checklist && checklist.catalogId===p.catalogId && checklist.slug===p.slug && checklist.beforeSha256===p.beforeSha256 && checklist.applied===false && checklist.approvals.every(a=>a.approved===false),'Checklist arricchimento non conforme');
  return {researchId:p.researchId,catalogId:p.catalogId,slug:p.slug,beforeSha256:p.beforeSha256,preconditionVerified:true,applied:false,status:'prepared_not_applied',openIssues:checklist.openIssues};
 });
 const visible={};
 for(const target of ['production','preview']){
  const actual=parsed.filter(e=>isVisible(e.data,target)).map(e=>e.data.catalogId).sort();
  assert(same(actual,before.visibilityBefore[target].slice().sort()),'Regressione di visibilità per contenuti precedenti');
  visible[target]=actual;
 }
 return {formatVersion:1,baseCommit:before.baseCommit,sourceSha256:plan.sourceSha256,summary:{integratedDrafts:3,newlyPublished:0,demoUpdates:0,enrichmentsApplied:0,identityOrSlugCollisions:0},integrated,enrichments,visibility:{policy:'Real editorial drafts excluded in both public targets; unchanged demo preview retained',visibleIds:visible,publicDrafts:0,staticAudit:{command:'npm run integration:output',evidence:'docs/integration/p1.5/visibility-evidence.json',configurations:['production','preview','production-custom-growth','preview-root-http'],scope:'All dist files, compressed assets and direct URL browser checks; actual CI audits run after build'}},history:{p13Unchanged:true,p14Unchanged:true,p12Unchanged:true},registry:{existingPreserved:true,added:3,sha256:sha(readBytes('src/catalog/registry.json'))},repeatImport:{additions:0,skipped:3},publicationAuthorized:false,limitations:['Draft recipes retain P1.4 editorial and culinary limitations.','Bodies copied verbatim include historical annotations referring to the formerly external drafts.','Local Astro caches and repository files are not public deployment artifacts; only audited dist is deployable. No deployment performed.']};
}

export function outputFiles(folder='dist'){
 return readdirSync(folder).sort().flatMap(name=>{
  const file=path.join(folder,name),info=lstatSync(file);
  if(info.isSymbolicLink())throw new Error('Symlink non consentito nel dist pubblico: '+file);
  return info.isDirectory()?outputFiles(file):[file];
 });
}
export function outputFingerprint(folder='dist'){
 return Object.fromEntries(outputFiles(folder).map(file=>[path.relative(folder,file).replaceAll('\\','/'),sha(readFileSync(file))]));
}
export function auditPublicOutput(entries,folder='dist'){
 const files=outputFiles(folder),markers=new Set();
 for(const {data,body} of entries){
  for(const value of [data.catalogId,data.slug,data.names.italian,data.description,body,...data.sources.map(s=>s.url),...data.steps.map(s=>s.text)]){
   if(!value || value.length<12)continue;
   markers.add(value);markers.add(JSON.stringify(value).slice(1,-1));
   markers.add(value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'));
   markers.add([...value].map(c=>c.charCodeAt(0)>127?'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'):c).join(''));
  }
  assert(!files.some(file=>path.relative(folder,file).replaceAll('\\','/').startsWith(`ricette/${data.slug}/`)),'Pagina draft generata');
 }
 let compressedFilesScanned=0;
 for(const file of files){
  assert(!/\.(zip|tar|7z)$/i.test(file),'Archivio pubblico non ispezionabile: '+file);
  let bytes=readFileSync(file);
  if(file.endsWith('.gz')){bytes=gunzipSync(bytes);compressedFilesScanned++;}
  if(file.endsWith('.br')){bytes=brotliDecompressSync(bytes);compressedFilesScanned++;}
  for(const marker of markers)assert(!bytes.includes(Buffer.from(marker)),`Dati draft esposti in ${path.relative(folder,file)}: ${marker.slice(0,60)}`);
 }
 return {filesScanned:files.length,markersChecked:markers.size,allFileTypes:true,compressedFilesScanned,compressionFormatsSupported:['gzip','brotli'],draftLeaks:0,fingerprint:sha(stableJSON(outputFingerprint(folder)))};
}
