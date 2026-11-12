import {z} from 'astro/zod';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {sourceSchema,recipeSchema} from './schema.mjs';
import {validateCatalog} from './validate.mjs';
import {planImport} from './import.mjs';
import {researchId,stableJSON} from './research/input.mjs';
import {surveyNamespace} from './research/survey.mjs';
import {nameSignatures,relatedNames} from './research/matches.mjs';

const text=z.string().trim().min(1),date=z.iso.date(),uuid=z.uuid();
const source=sourceSchema.extend({independenceGroup:text,assessment:text,access:z.enum(['full','partial-paywall'])});
const claim=z.strictObject({field:text,text,sourceIds:z.array(text),locator:text,status:z.enum(['supported','conflicting','unresolved','editorial-inference'])});
const dossier=z.strictObject({
  formatVersion:z.literal(1),researchId:z.string().regex(/^RP-\d{4}$/),researchTechnicalId:uuid,
  researchLabel:text,proposedSlug:text,editorialStatus:z.literal('candidate'),consultedAt:date,
  names:z.unknown(),
  geography:z.unknown(),potatoRole:z.enum(['protagonist','secondary']).nullable(),potatoRoleBasis:text,
  sourceIds:z.array(text),claims:z.array(claim).min(1),documentedFormula:z.strictObject({sourceId:text,servings:z.number().positive().nullable(),ingredients:text,timing:text}).nullable(),
  originalProcedure:z.array(text),identity:z.strictObject({disposition:z.enum(['existing-enrichment','new-primary','unresolved']),existingCatalogId:uuid.nullable()}),
  decision:z.strictObject({outcome:z.enum(['ready_for_conversion','needs_review','duplicate_or_variant']),reason:text}),
  openQuestions:z.array(text).min(1),recordPath:text.nullable(),
});
// Names contain an extra explanation for the editorial Italian translation.
const names=z.strictObject({italian:text,original:z.strictObject({text,language:z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)}),alternatives:z.array(z.strictObject({text,language:z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)})),italianNameBasis:text});
const dossierSchema=dossier.extend({names,geography:z.strictObject({continent:text,country:z.strictObject({code:text,name:text}),region:text.nullable(),traditions:z.array(text)})});
const selectionSchema=z.strictObject({formatVersion:z.literal(1),baseCommit:z.string().regex(/^[a-f0-9]{40}$/),datasetSha256:z.string().regex(/^[a-f0-9]{64}$/),consultedAt:date,sourceIds:z.array(text).min(1)});
const sha=value=>createHash('sha256').update(value).digest('hex');
const unique=(values,label)=>{if(new Set(values).size!==values.length)throw new Error(`Duplicati: ${label}`);};

export function readEditorialBundle(root='docs/editorial/first-ten') {
  const read=file=>JSON.parse(readFileSync(path.join(root,file),'utf8'));
  const inputs=['selection.json','sources.json','search-log.json','records.json','preserved-catalog.json',...readdirSync(path.join(root,'dossiers')).filter(name=>name.endsWith('.json')).sort().map(name=>'dossiers/'+name)];
  return {selection:read('selection.json'),sources:read('sources.json'),dossiers:inputs.filter(name=>name.startsWith('dossiers/')).map(read),records:read('records.json'),inputHashes:Object.fromEntries(inputs.map(file=>[file,sha(readFileSync(path.join(root,file)))]))};
}

// Referential/editorial gates only: passing does not prove a culinary or historical claim true.
export function validateEditorialBundle(bundle,datasetText,existing,registry) {
  const selection=selectionSchema.parse(bundle.selection);
  if(sha(datasetText)!==selection.datasetSha256)throw new Error('Dataset P1.2 modificato: riesaminare i dossier');
  unique(selection.sourceIds,'selezione');
  const sourceFile=z.strictObject({formatVersion:z.literal(1),consultedAt:date,sources:z.array(source)}).parse(bundle.sources);
  const sources=new Map(sourceFile.sources.map(item=>[item.id,item]));unique(sourceFile.sources.map(item=>item.id),'fonti');
  const dossiers=bundle.dossiers.map(item=>dossierSchema.parse(item));unique(dossiers.map(item=>item.researchId),'dossier');
  if(stableJSON(dossiers.map(item=>item.researchId).sort())!==stableJSON([...selection.sourceIds].sort()))throw new Error('Dossier diversi dalla selezione richiesta');
  const current=validateCatalog(existing,registry);
  const rows=new Map(JSON.parse(datasetText).entries.map(row=>[row.id,row]));
  const records=z.strictObject({formatVersion:z.literal(1),entries:z.array(z.strictObject({collection:z.literal('ricette'),data:recipeSchema,body:z.string()}))}).parse(bundle.records).entries;
  const byResearch=new Map();
  for(const entry of records){
    const ids=entry.data.externalIds.filter(id=>id.namespace===surveyNamespace);
    if(ids.length!==1 || byResearch.has(ids[0].value))throw new Error('Identità di ricerca assente o duplicata');
    byResearch.set(ids[0].value,entry);
  }
  const identityChecks=[];
  for(const item of dossiers){
    const row=rows.get(item.researchId);
    if(!row || row.nome!==item.researchLabel || row.slug_proposto!==item.proposedSlug || researchId(surveyNamespace,row.id)!==item.researchTechnicalId)throw new Error('Identità di ricerca alterata');
    if(item.consultedAt!==selection.consultedAt || sourceFile.consultedAt!==selection.consultedAt)throw new Error('Data di consultazione incoerente');
    unique(item.sourceIds,'fonti del dossier');
    for(const id of item.sourceIds)if(!sources.has(id) || sources.get(id).accessedAt!==item.consultedAt)throw new Error('Fonte assente o data incoerente');
    for(const field of ['names','geography','ingredients','yieldTiming','potatoRole'])if(!item.claims.some(c=>c.field===field))throw new Error('Verifica obbligatoria assente: '+field);
    for(const c of item.claims){
      unique(c.sourceIds,'riferimenti affermazione');
      if(['supported','conflicting'].includes(c.status) && !c.sourceIds.length)throw new Error('Affermazione senza fonte');
      for(const id of c.sourceIds)if(!item.sourceIds.includes(id))throw new Error('Riferimento fonte estraneo al dossier');
    }
    if(item.documentedFormula && !item.sourceIds.includes(item.documentedFormula.sourceId))throw new Error('Formula senza fonte del dossier');
    const owner=Object.entries(registry).find(([,route])=>route.collection==='ricette' && route.slug===item.proposedSlug)?.[0]??null;
    const matches=current.filter(e=>e.collection==='ricette' && relatedNames(nameSignatures({names:item.names}),nameSignatures(e.data))).map(e=>e.data.catalogId);
    const prior=item.identity.existingCatalogId;
    if(prior && (!registry[prior] || registry[prior].collection!=='ricette' || !current.some(e=>e.data.catalogId===prior)))throw new Error('Identità esistente non trovata');
    if(item.decision.outcome==='duplicate_or_variant' && (!prior || item.identity.disposition!=='existing-enrichment'))throw new Error('Arricchimento senza identità');
    const entry=byResearch.get(item.researchId);
    if(item.decision.outcome==='ready_for_conversion'){
      if(owner || matches.length || prior || item.identity.disposition!=='new-primary')throw new Error('Collisione/possibile duplicato: conversione bloccata');
      const groups=new Set(item.sourceIds.filter(id=>sources.get(id).access==='full').map(id=>sources.get(id).independenceGroup));
      if(groups.size<2 || !item.documentedFormula || !item.originalProcedure.length || !item.potatoRole)throw new Error('Evidenze insufficienti per conversione');
      if(!entry || item.recordPath!=='records.json#'+item.researchId)throw new Error('Record atteso assente');
      const data=entry.data;
      if(!['candidate','draft'].includes(data.editorial.status) || data.demo || data.catalogId!==item.researchTechnicalId || data.slug!==item.proposedSlug || data.relation.kind!=='primary' || data.duplicateOf)throw new Error('Promozione o identità record non consentita');
      if(data.date!==item.consultedAt || data.potatoRole!==item.potatoRole || stableJSON(data.names)!==stableJSON({italian:item.names.italian,original:item.names.original,alternatives:item.names.alternatives}) || stableJSON(data.provenance)!==stableJSON(item.geography))throw new Error('Record incoerente col dossier');
      if(stableJSON(data.sources.map(s=>s.id).sort())!==stableJSON([...item.sourceIds].sort()))throw new Error('Fonti del record incomplete');
      const formula=sources.get(item.documentedFormula.sourceId);
      if(formula.access!=='full')throw new Error('Formula principale non integralmente consultata');
      if(data.servings!==item.documentedFormula.servings)throw new Error('Porzioni diverse dalla formula scelta');
      for(const s of data.sources){const original=sources.get(s.id);if(!item.sourceIds.includes(s.id) || !original || Object.keys(s).some(k=>s[k]!==original[k]))throw new Error('Fonte record alterata');}
      if(!data.sources.some(s=>s.id===formula.id))throw new Error('Fonte della formula assente dal record');
    } else if(entry || item.recordPath!==null)throw new Error('Record creato per un caso irrisolto');
    identityChecks.push({researchId:item.researchId,researchTechnicalId:item.researchTechnicalId,reservedSlugOwner:owner,possibleCatalogMatches:matches,existingCatalogId:prior,outcome:item.decision.outcome});
  }
  if(records.length!==dossiers.filter(d=>d.decision.outcome==='ready_for_conversion').length)throw new Error('Record estranei alla selezione');
  const plan=planImport(records,current,registry);
  return {formatVersion:1,baseCommit:selection.baseCommit,consultedAt:selection.consultedAt,datasetSha256:selection.datasetSha256,inputHashes:bundle.inputHashes,summary:{selected:selection.sourceIds.length,dossiers:dossiers.length,sources:sources.size,readyForConversion:dossiers.filter(d=>d.decision.outcome==='ready_for_conversion').length,needsReview:dossiers.filter(d=>d.decision.outcome==='needs_review').length,duplicateOrVariant:dossiers.filter(d=>d.decision.outcome==='duplicate_or_variant').length,p11Records:records.length},identityChecks,sourceContentChanged:false,registryChanged:false,appliedToAstro:false,publicationAuthorized:false,plan:{additions:plan.additions.length,skipped:plan.skipped},catalogFingerprint:sha(stableJSON({entries:current.map(e=>({collection:e.collection,data:e.data})).sort((a,b)=>a.data.catalogId.localeCompare(b.data.catalogId)),registry})),limitations:['Validazione strutturale e referenziale; non verifica automatica delle affermazioni.','Nessuna prova in cucina né review indipendente già completata.','Dossier e record separati dai loader Astro; nessun aggiornamento dei demo.']};
}

export function renderSourceMatrix(bundle){
  const sources=new Map(bundle.sources.sources.map(s=>[s.id,s]));
  const cell=value=>value.replaceAll('|','\\|').replaceAll('\n',' ');
  return '# Matrice fonti e affermazioni\n\nConsultazione effettiva: '+bundle.selection.consultedAt+'. `supported` significa riscontro nella fonte, non approvazione editoriale verified. `editorial-inference` distingue le valutazioni della redazione; `unresolved` non equivale a prova.\n\n| Candidata | Campo | Stato | Affermazione / limite | Fonti e punto di riscontro |\n| --- | --- | --- | --- | --- |\n'+bundle.dossiers.flatMap(d=>d.claims.map(c=>'| '+[d.researchId,c.field,c.status,c.text,c.sourceIds.map(id=>`[${id}](${sources.get(id).url})`).join(', ')+' — '+c.locator].map(cell).join(' | ')+' |')).join('\n')+'\n';
}
