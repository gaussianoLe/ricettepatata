import {createHash} from 'node:crypto';
import {profileSchema,stableJSON} from './input.mjs';
import {adaptResearchRow} from './adapter.mjs';
import {nameSignatures,relatedNames} from './matches.mjs';
import {validateCatalog} from '../validate.mjs';
import {planImport,stageImport} from '../import.mjs';

export const batchSize=50;
export function pendingBatchReport() {
  return {formatVersion:1,status:'waiting_for_dataset',datasetAvailable:false,importExecuted:false,expectedCandidates:batchSize,summary:{received:0,accepted:0,excluded:0,review:0},accepted:[],excluded:[],review:[],blockingReasons:['DATASET_NOT_PROVIDED','MAPPING_PROFILE_TO_FINALIZE']};
}
const sourceKey=(namespace,value)=>JSON.stringify([namespace,value]);

export function prepareResearchBatch(input,rawProfile,existing,registry) {
  const profile=profileSchema.parse(rawProfile);const current=validateCatalog(existing,registry);
  const report={formatVersion:1,status:'prepared',datasetAvailable:true,importExecuted:false,expectedCandidates:batchSize,datasetId:profile.datasetId,inputFingerprint:input.fingerprint,profileFingerprint:createHash('sha256').update(stableJSON(profile)).digest('hex'),summary:{received:input.rows.length,accepted:0,excluded:0,review:0},accepted:[],excluded:[],review:[],unmappedColumns:input.columns.filter(column=>!Object.values(profile.columns).includes(column)),blockingReasons:[]};
  if(input.rows.length===0)report.blockingReasons.push('EMPTY_DATASET');
  if(input.rows.length>batchSize)report.blockingReasons.push('BATCH_TOO_LARGE');
  const byId=new Map(current.map(entry=>[entry.data.catalogId,entry]));
  const external=new Map(current.flatMap(entry=>entry.data.externalIds.map(identifier=>[sourceKey(identifier.namespace,identifier.value),entry])));
  const reserved=new Map(Object.entries(registry).map(([catalogId,route])=>[`${route.collection}/${route.slug}`,catalogId]));
  const sourceIds=new Map(current.flatMap(entry=>entry.data.externalIds.filter(identifier=>identifier.namespace===profile.datasetId).map(identifier=>[identifier.value,entry.data.catalogId])));
  // Resolve references to explicit IDs anywhere in this lot, independently of row order.
  for(const row of input.rows) {
    const source=row && Object.hasOwn(row,profile.columns.sourceId)?row[profile.columns.sourceId]:undefined;
    const explicit=row && profile.columns.catalogId && Object.hasOwn(row,profile.columns.catalogId)?row[profile.columns.catalogId]:undefined;
    if(typeof source==='string' && explicit && !sourceIds.has(source))sourceIds.set(source,explicit);
  }
  const rows=input.rows.map((raw,index)=>{
    const adapted=adaptResearchRow(raw,profile,sourceIds);
    return {...adapted,index:index+1,fingerprint:createHash('sha256').update(stableJSON(raw)).digest('hex'),state:adapted.errors.length?'review':'accepted',reasons:[...adapted.errors],matches:[]};
  });
  const flag=(row,code,details={})=>{if(!row.reasons.some(reason=>reason.code===code))row.reasons.push({code,...details});if(row.state!=='excluded')row.state='review';};
  const groups=(key)=>{
    const grouped=new Map();for(const row of rows){const value=key(row);if(value){if(!grouped.has(value))grouped.set(value,[]);grouped.get(value).push(row);}}return grouped;
  };
  for(const group of groups(row=>row.sourceId).values())if(group.length>1) {
    if(new Set(group.map(row=>row.fingerprint)).size>1)for(const row of group)flag(row,'CONFLICTING_SOURCE_ROWS');
    else for(const row of group.slice(1)){row.state='excluded';row.reasons=[{code:'DUPLICATE_INPUT_ROW',firstRow:group[0].index}];}
  }
  for(const row of rows)if(row.state==='accepted') {
    const data=row.entry.data,previous=external.get(sourceKey(profile.datasetId,row.sourceId));
    if(previous) {
      row.state=previous.collection==='ricette' && previous.data.catalogId===data.catalogId?'excluded':'review';
      row.reasons.push({code:previous.data.catalogId===data.catalogId?'SOURCE_ALREADY_REGISTERED':'IDENTITY_SOURCE_MISMATCH',catalogId:previous.data.catalogId});continue;
    }
    if(byId.has(data.catalogId))flag(row,'IDENTITY_COLLISION',{catalogId:data.catalogId});
    const reservation=registry[data.catalogId];
    if(reservation && (reservation.collection!=='ricette' || reservation.slug!==data.slug))flag(row,'RESERVED_IDENTITY');
    const owner=reserved.get(`ricette/${data.slug}`);if(owner && owner!==data.catalogId)flag(row,'SLUG_COLLISION',{catalogId:owner});
  }
  for(const group of groups(row=>row.state!=='excluded' && row.entry?.data.catalogId).values())if(group.length>1)for(const row of group)flag(row,'BATCH_IDENTITY_COLLISION');
  for(const group of groups(row=>row.state!=='excluded' && row.entry?.data.slug).values())if(group.length>1)for(const row of group)flag(row,'BATCH_SLUG_COLLISION');
  const candidates=rows.filter(row=>row.entry && row.state!=='excluded');
  const known=[...current.filter(entry=>entry.collection==='ricette').map(entry=>({data:entry.data,signatures:nameSignatures(entry.data)})),...candidates.map(row=>({data:row.entry.data,signatures:nameSignatures(row.entry.data),row:row.index}))];
  for(const row of candidates) {
    const data=row.entry.data,signatures=nameSignatures(data);
    for(const other of known) {
      if(other.row===row.index || other.data.catalogId===data.catalogId)continue;
      if(data.duplicateOf===other.data.catalogId || other.data.duplicateOf===data.catalogId)continue;
      if((data.relation.kind==='variant' && data.relation.primaryId===other.data.catalogId) || (other.data.relation.kind==='variant' && other.data.relation.primaryId===data.catalogId))continue;
      const match=relatedNames(signatures,other.signatures);
      if(match){row.matches.push({catalogId:other.data.catalogId,slug:other.data.slug,...(other.row?{row:other.row}:{}),kind:match,country:other.data.provenance.country?.code??null,region:other.data.provenance.region});flag(row,'POSSIBLE_DUPLICATE_OR_VARIANT');}
    }
  }
  // A duplicate declaration is an exclusion, never a new automatic merge or relation inference.
  for(const row of candidates)if(row.entry.data.duplicateOf) {
    const target=byId.get(row.entry.data.duplicateOf)??rows.find(other=>other.entry?.data.catalogId===row.entry.data.duplicateOf)?.entry;
    if(target?.collection==='ricette' && !target.data.duplicateOf){row.state='excluded';row.reasons.push({code:'DECLARED_DUPLICATE',catalogId:target.data.catalogId});}
    else flag(row,'UNRESOLVED_DUPLICATE');
  }
  let changed=true;
  while(changed) {
    changed=false;
    for(const row of rows)if(row.state==='accepted' && row.entry.data.relation.kind==='variant') {
      const primaryId=row.entry.data.relation.primaryId;
      const primary=byId.get(primaryId)??rows.find(other=>other.state==='accepted' && other.entry?.data.catalogId===primaryId)?.entry;
      if(!primary || primary.collection!=='ricette' || primary.data.relation.kind!=='primary' || primary.data.duplicateOf){flag(row,'UNRESOLVED_PRIMARY');changed=true;}
    }
  }
  if(report.blockingReasons.includes('BATCH_TOO_LARGE'))for(const row of rows)if(row.state==='accepted')flag(row,'BATCH_TOO_LARGE');
  const accepted=rows.filter(row=>row.state==='accepted').map(row=>row.entry);
  let plan;
  try{plan=planImport(accepted,current,registry);}catch(error){report.blockingReasons.push('GLOBAL_VALIDATION_FAILED');for(const row of rows)if(row.state==='accepted')flag(row,'GLOBAL_VALIDATION_FAILED');}
  for(const row of rows) {
    report[row.state].push({row:row.index,sourceId:row.sourceId??null,catalogId:row.catalogId??null,slug:row.entry?.data.slug??null,sourceFingerprint:row.fingerprint,reasons:row.reasons,warnings:row.warnings,missingFields:row.missingFields??[],matches:row.matches});
  }
  for(const bucket of ['accepted','excluded','review'])report.summary[bucket]=report[bucket].length;
  if(report.blockingReasons.length)report.status='blocked';
  else if(report.review.length)report.status='needs_review';
  const entries=rows.filter(row=>row.state==='accepted').map(row=>row.entry);
  return {report,entries,plan:plan && report.blockingReasons.length===0?plan:undefined};
}

export function stageResearchBatch(batch,directory,{allowPartial=false,checkout=process.cwd()}={}) {
  if(!batch.report.datasetAvailable || !batch.plan || !batch.entries.length || batch.report.blockingReasons.length)throw new Error('Lotto non disponibile o bloccato: nessuno staging');
  if((batch.entries.length!==batchSize || batch.report.review.length) && !allowPartial)throw new Error('Lotto parziale: richiesta conferma esplicita --allow-partial');
  if(batch.entries.some(entry=>entry.collection!=='ricette' || entry.data.editorial.status!=='candidate'))throw new Error('Lo staging P1.2 ammette solo ricette candidate');
  if(stableJSON(batch.plan.additions)!==stableJSON(batch.entries))throw new Error('Piano di staging incoerente con i candidati accettati');
  return stageImport(batch.plan,directory,checkout,{
    'batch-report.json':{...batch.report,stagingPrepared:true,partialAcknowledged:allowPartial,importExecuted:false},
    'candidates.json':{formatVersion:1,entries:batch.entries},
  });
}
