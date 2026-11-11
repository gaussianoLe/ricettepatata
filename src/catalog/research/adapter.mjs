import {recipeSchema} from '../schema.mjs';
import {researchId} from './input.mjs';
const jsonFields=new Set(['alternativeNames','traditions','courses','cookingMethods','families','occasions','ingredients','steps','timing','servings','sources','notes']);
const empty=value=>value===undefined || value===null || value==='';

export function adaptResearchRow(row,profile,existingSourceIds=new Map()) {
  if(!row || typeof row!=='object' || Array.isArray(row))return {errors:[{code:'INVALID_ROW',field:'row'}],warnings:[]};
  const errors=[],warnings=[],missing=[];
  const get=field=>{
    const column=profile.columns[field];const value=column && Object.hasOwn(row,column)?row[column]:undefined;
    if(empty(value)){missing.push(field);return undefined;}
    if(jsonFields.has(field) && typeof value==='string') {
      try{const parsed=JSON.parse(value);if(parsed===null){missing.push(field);return undefined;}return parsed;}catch{errors.push({code:'INVALID_JSON_CELL',field});return undefined;}
    }
    return value;
  };
  const sourceId=get('sourceId');
  if(typeof sourceId!=='string' || !sourceId || sourceId!==sourceId.trim()) errors.push({code:'INVALID_SOURCE_ID',field:'sourceId'});
  const catalogId=get('catalogId')??existingSourceIds.get(sourceId)??(typeof sourceId==='string'?researchId(profile.datasetId,sourceId):undefined);
  const countryCode=get('countryCode'),countryName=get('countryName');
  if(Boolean(countryCode)!==Boolean(countryName))errors.push({code:'INCOMPLETE_COUNTRY',field:'provenance.country'});
  const suppliedSources=get('sources');
  const flat={url:get('sourceUrl'),title:get('sourceTitle'),author:get('sourceAuthor'),accessedAt:get('sourceAccessedAt'),kind:get('sourceKind')};
  const flatValues=Object.values(flat).filter(value=>!empty(value));
  if(suppliedSources!==undefined && flatValues.length)errors.push({code:'AMBIGUOUS_SOURCE_MAPPING',field:'sources'});
  if(flatValues.length && flatValues.length!==Object.keys(flat).length)errors.push({code:'INCOMPLETE_SOURCE',field:'sources'});
  const sources=suppliedSources??(flatValues.length===Object.keys(flat).length?[{id:'research-source',...flat}]:[]);
  const relationKind=get('relationKind'),primaryId=get('primaryId'),primarySourceId=get('primarySourceId');
  if(primaryId && primarySourceId)errors.push({code:'AMBIGUOUS_PRIMARY_REFERENCE',field:'relation'});
  if(relationKind==='primary' && (primaryId || primarySourceId))errors.push({code:'UNEXPECTED_PRIMARY_REFERENCE',field:'relation'});
  if(primarySourceId!==undefined && (typeof primarySourceId!=='string' || !primarySourceId || primarySourceId!==primarySourceId.trim()))errors.push({code:'INVALID_PRIMARY_SOURCE_ID',field:'relation'});
  const relation=relationKind==='variant'?{kind:'variant',primaryId:primaryId??(primarySourceId?existingSourceIds.get(primarySourceId)??researchId(profile.datasetId,primarySourceId):undefined)}:{kind:relationKind};
  const duplicateOf=get('duplicateOf');
  const record={
    schemaVersion:1,catalogId,slug:get('slug'),
    names:{italian:get('italianTitle'),original:{text:get('originalTitle'),language:get('originalLanguage')},alternatives:get('alternativeNames')??[]},
    description:get('description'),date:profile.recordDate,demo:false,
    editorial:{status:'candidate',author:profile.editorialAuthor},
    sources,notes:get('notes')??[],externalIds:typeof sourceId==='string'?[{namespace:profile.datasetId,value:sourceId}]:[],
    provenance:{continent:get('continent')??null,country:countryCode && countryName?{code:countryCode,name:countryName}:null,region:get('region')??null,traditions:get('traditions')??[]},
    taxonomy:{courses:get('courses')??[],cookingMethods:get('cookingMethods')??[],families:get('families')??[],occasions:get('occasions')??[]},
    potatoRole:get('potatoRole'),relation,...(duplicateOf===undefined?{}:{duplicateOf}),
    timing:get('timing')??null,servings:get('servings')??null,ingredients:get('ingredients')??[],steps:get('steps')??[],color:'gold',
  };
  const body=get('body')??'';if(typeof body!=='string')errors.push({code:'INVALID_BODY',field:'body'});
  const parsed=recipeSchema.safeParse(record);
  if(!parsed.success)for(const issue of parsed.error.issues)errors.push({code:'MODEL_VALIDATION',field:issue.path.join('.'),message:issue.message});
  for(const field of ['sources','ingredients','steps','timing','servings'])if(missing.includes(field) && !(field==='sources' && flatValues.length))warnings.push({code:'NOT_PROVIDED',field});
  return {sourceId:typeof sourceId==='string'?sourceId:null,catalogId,errors,warnings,missingFields:missing,entry:parsed.success?{collection:'ricette',data:parsed.data,body}:undefined};
}
