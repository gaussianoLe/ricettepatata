import {z} from 'astro/zod';
import {parse} from 'csv-parse/sync';
import {createHash} from 'node:crypto';
import {stableJSON,researchId} from './input.mjs';
import {normalizeName,nameSignatures,relatedNames} from './matches.mjs';
import {validateCatalog} from '../validate.mjs';
import {planImport,stageImport} from '../import.mjs';

export const surveyNamespace='ricettepatata-exploratory-census';
export const surveyFields=['id','nome','paese','area','categoria_preliminare','slug_proposto','stato','fonte_individuale','note','stato_editoriale','verifica_fonti','verifica_ingredienti','relazione_canonica','priorita'];
const text=z.string();
const rowSchema=z.strictObject(Object.fromEntries(surveyFields.map(field=>[field,text]))).extend({
  id:z.string().regex(/^RP-\d{4}$/),nome:z.string().min(1),slug_proposto:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),stato_editoriale:z.literal('candidate'),
});
const surveySchema=z.strictObject({formatVersion:z.literal('research-candidates-v1'),importable:z.literal(false),entries:z.array(rowSchema).min(1).max(50)});
const hash=text=>createHash('sha256').update(text).digest('hex');
const duplicateValues=rows=>{
  const groups=new Map();for(const row of rows){if(!groups.has(row.id))groups.set(row.id,[]);groups.get(row.id).push(row);}
  return [...groups].filter(([,values])=>values.length>1).map(([id])=>id);
};

export function compareSurveyRepresentations(jsonText,csvText) {
  const primary=surveySchema.parse(JSON.parse(jsonText.replace(/^\uFEFF/,'')));
  let columns=[];
  const alternative=parse(csvText,{bom:true,skip_empty_lines:true,max_record_size:5_000_000,columns:header=>{
    if(new Set(header).size!==header.length)throw new Error('Intestazioni CSV duplicate');columns=header;return header;
  }});
  const duplicateJsonIds=duplicateValues(primary.entries),duplicateCsvIds=duplicateValues(alternative);
  const jsonById=new Map(primary.entries.map(row=>[row.id,row]));
  const csvById=new Map(alternative.map(row=>[row.id,row]));
  const differences=[];
  for(const row of primary.entries){
    const csv=csvById.get(row.id);
    if(!csv){differences.push({id:row.id,kind:'MISSING_CSV_RECORD'});continue;}
    for(const field of surveyFields)if(row[field]!==csv[field])differences.push({id:row.id,kind:'FIELD_MISMATCH',field,jsonValue:row[field],csvValue:csv[field]??null});
  }
  for(const row of alternative)if(!jsonById.has(row.id))differences.push({id:row.id??null,kind:'EXTRA_CSV_RECORD'});
  const sameFields=columns.length===surveyFields.length && surveyFields.every(field=>columns.includes(field));
  const equivalent=sameFields && !duplicateJsonIds.length && !duplicateCsvIds.length && !differences.length && primary.entries.length===alternative.length;
  return {primary,comparison:{equivalent,sameFields,sameOrder:primary.entries.map(row=>row.id).join('\n')===alternative.map(row=>row.id).join('\n'),jsonRecords:primary.entries.length,csvRecords:alternative.length,duplicateJsonIds,duplicateCsvIds,differences,jsonFingerprint:hash(jsonText),csvFingerprint:hash(csvText)}};
}

export function prepareSurveyLot(jsonText,csvText,methodologyText,existing,registry) {
  const {primary,comparison}=compareSurveyRepresentations(jsonText,csvText);
  const current=validateCatalog(existing,registry);
  const report={formatVersion:1,datasetId:surveyNamespace,lot:'lotto_01',status:comparison.equivalent?'needs_review':'blocked_inconsistent_representations',datasetAvailable:true,importExecuted:false,editorialState:'candidate',stagingKind:'research_quarantine',comparison,methodologyFingerprint:hash(methodologyText),catalogFingerprint:hash(stableJSON({entries:current.map(entry=>({collection:entry.collection,data:entry.data})).sort((a,b)=>a.data.catalogId.localeCompare(b.data.catalogId)),registry})),summary:{received:primary.entries.length,alternativeRowsNotProcessed:comparison.csvRecords,accepted:0,excluded:0,review:primary.entries.length},accepted:[],excluded:[],review:[],blockingReasons:['RESEARCH_PAYLOAD_NOT_IMPORTABLE','P11_REQUIRED_FACTS_NOT_PROVIDED'],statistics:{identityCollisions:0,slugCollisions:0,rowsWithPossibleMatches:0,missingIndividualSources:0},sourceContentChanged:false};
  if(!comparison.equivalent)report.blockingReasons.unshift('JSON_CSV_MISMATCH');
  const registered=new Map(current.map(entry=>[entry.data.catalogId,entry]));
  const reserved=new Map(Object.entries(registry).map(([id,route])=>[`${route.collection}/${route.slug}`,id]));
  const recipes=current.filter(entry=>entry.collection==='ricette').map(entry=>({data:entry.data,signatures:nameSignatures(entry.data)}));
  const proposed=primary.entries.map(row=>({source:row,catalogId:researchId(surveyNamespace,row.id),signature:normalizeName(row.nome)}));
  const group=(field)=>{
    const groups=new Map();for(const row of proposed){const value=field(row);if(!groups.has(value))groups.set(value,[]);groups.get(value).push(row.source.id);}return groups;
  };
  const slugGroups=group(row=>row.source.slug_proposto),nameGroups=group(row=>row.signature);
  for(const proposal of proposed) {
    const row=proposal.source;
    const reasons=[{code:'SOURCE_MARKED_NOT_IMPORTABLE'},{code:'MISSING_ORIGINAL_LANGUAGE'},{code:'ITALIAN_AND_ORIGINAL_TITLES_NOT_DISTINGUISHED'},{code:'POTATO_ROLE_NOT_CONFIRMED'},{code:'CANONICAL_RELATION_UNRESOLVED'},{code:'RECIPE_DESCRIPTION_NOT_PROVIDED'},{code:'PRELIMINARY_TAXONOMY_NOT_MAPPED'}];
    const sourceMissing=!row.fonte_individuale.trim();
    reasons.push({code:sourceMissing?'INDIVIDUAL_SOURCE_MISSING':'INDIVIDUAL_SOURCE_METADATA_INCOMPLETE'});
    if(sourceMissing)report.statistics.missingIndividualSources++;
    const identity=registered.get(proposal.catalogId)??(registry[proposal.catalogId]?{data:{catalogId:proposal.catalogId}}:undefined);
    if(identity){reasons.push({code:'IDENTITY_COLLISION',catalogId:proposal.catalogId});report.statistics.identityCollisions++;}
    const owner=reserved.get(`ricette/${row.slug_proposto}`);
    if(owner){reasons.push({code:'SLUG_COLLISION',catalogId:owner});report.statistics.slugCollisions++;}
    if(slugGroups.get(row.slug_proposto).length>1)reasons.push({code:'BATCH_SLUG_COLLISION',sourceIds:slugGroups.get(row.slug_proposto)});
    if(nameGroups.get(proposal.signature).length>1)reasons.push({code:'BATCH_NAME_MATCH',sourceIds:nameGroups.get(proposal.signature)});
    if(comparison.duplicateJsonIds.includes(row.id))reasons.push({code:'DUPLICATE_SOURCE_ID'});
    const matches=[];
    for(const recipe of recipes) {
      const kind=relatedNames([proposal.signature],recipe.signatures);
      if(kind)matches.push({scope:'catalog',catalogId:recipe.data.catalogId,slug:recipe.data.slug,name:recipe.data.names.italian,kind});
    }
    for(const other of proposed)if(other!==proposal){const kind=relatedNames([proposal.signature],[other.signature]);if(kind)matches.push({scope:'lot',sourceId:other.source.id,name:other.source.nome,kind});}
    if(matches.length){reasons.push({code:'POSSIBLE_DUPLICATE_OR_VARIANT'});report.statistics.rowsWithPossibleMatches++;}
    report.review.push({sourceId:row.id,proposedCatalogId:proposal.catalogId,proposedSlug:row.slug_proposto,editorialState:'candidate',researchLabel:row.nome,declaredCountry:row.paese,declaredArea:row.area,preliminaryCategory:row.categoria_preliminare,sourceFingerprint:hash(stableJSON(row)),reasons,matches,missingRecipeData:['sources.author','sources.accessedAt','names.original.language','names.italian/original distinction','potatoRole','relation.kind','description','ingredients','steps','timing','servings'],p11RecordCreated:false});
  }
  return {primary,report,plan:comparison.equivalent?planImport([],current,registry):undefined,sourceTexts:{json:jsonText,csv:csvText,methodology:methodologyText}};
}

export function stageSurveyQuarantine(lot,directory,checkout=process.cwd()) {
  if(!lot.report.comparison.equivalent || !lot.plan)throw new Error('JSON e CSV non coerenti: staging bloccato');
  const verified=compareSurveyRepresentations(lot.sourceTexts.json,lot.sourceTexts.csv);
  if(!verified.comparison.equivalent || stableJSON(verified.primary)!==stableJSON(lot.primary) || verified.comparison.jsonFingerprint!==lot.report.comparison.jsonFingerprint || verified.comparison.csvFingerprint!==lot.report.comparison.csvFingerprint || hash(lot.sourceTexts.methodology)!==lot.report.methodologyFingerprint)throw new Error('Il lotto è stato modificato dopo la verifica');
  if(lot.plan.additions.length)throw new Error('Il lotto di ricerca non deve creare record Astro');
  return stageImport(lot.plan,directory,checkout,{
    'lot-report.json':{...lot.report,stagingPrepared:true},
    'research-quarantine.json':lot.primary,
    'source-inputs.json':{json:{role:'primary',sha256:lot.report.comparison.jsonFingerprint,text:lot.sourceTexts.json},csv:{role:'alternative_only',sha256:lot.report.comparison.csvFingerprint,text:lot.sourceTexts.csv},methodology:{role:'documentation_only',sha256:lot.report.methodologyFingerprint,text:lot.sourceTexts.methodology}},
  });
}
