import {parse} from 'csv-parse/sync';
import {z} from 'astro/zod';
import {createHash} from 'node:crypto';

export const researchFields=[
  'sourceId','catalogId','slug','italianTitle','originalTitle','originalLanguage','alternativeNames',
  'description','continent','countryCode','countryName','region','traditions','potatoRole',
  'courses','cookingMethods','families','occasions','ingredients','steps','timing','servings',
  'sources','sourceUrl','sourceTitle','sourceAuthor','sourceAccessedAt','sourceKind',
  'notes','relationKind','primaryId','primarySourceId','duplicateOf','body',
];
const mandatory=['sourceId','slug','italianTitle','originalTitle','originalLanguage','description','potatoRole','relationKind'];
export const profileSchema=z.strictObject({
  formatVersion:z.literal(1), datasetId:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  editorialAuthor:z.string().trim().min(1), recordDate:z.iso.date(),
  columns:z.partialRecord(z.enum(researchFields),z.string().min(1)),
}).superRefine((profile,ctx)=>{
  for(const field of mandatory) if(!profile.columns[field]) ctx.addIssue({code:'custom',path:['columns',field],message:'Mappatura obbligatoria'});
});

export function parseResearchInput(text,format) {
  const fingerprint=createHash('sha256').update(text).digest('hex');
  let rows,columns;
  if(format==='json') {
    const input=JSON.parse(text);
    rows=Array.isArray(input)?input:z.strictObject({formatVersion:z.literal(1),rows:z.array(z.unknown())}).parse(input).rows;
    columns=[...new Set(rows.flatMap(row=>row && typeof row==='object' && !Array.isArray(row)?Object.keys(row):[]))];
  } else if(format==='csv') {
    rows=parse(text,{bom:true,skip_empty_lines:true,max_record_size:5_000_000,columns:header=>{
      if(header.some(column=>!column) || new Set(header).size!==header.length) throw new Error('Intestazioni CSV vuote o duplicate');
      columns=header;return header;
    }});
  } else throw new Error('Formato ricerca richiesto: json oppure csv');
  return {rows,columns:columns??[],fingerprint};
}

// Application-specific UUIDv5 namespace. Never derive identity from title, row order or slug.
const namespace=Buffer.from('92d79d58a20d4c5a907bb64a32d8cf2a','hex');
export function researchId(datasetId,sourceId) {
  const bytes=createHash('sha1').update(namespace).update(JSON.stringify([datasetId,sourceId])).digest().subarray(0,16);
  bytes[6]=(bytes[6]&0x0f)|0x50;bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=bytes.toString('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function stableJSON(value) {
  if(Array.isArray(value))return '['+value.map(stableJSON).join(',')+']';
  if(value && typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableJSON(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
