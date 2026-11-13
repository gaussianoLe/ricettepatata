import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readCatalog} from '../src/catalog/io.mjs';
import {recipeSchema} from '../src/catalog/schema.mjs';
/** @typedef {import('astro/zod').z.infer<typeof import('../src/catalog/schema.mjs').recipeSchema>} RecipeRecord */
/** @typedef {{file:string,collection:string,data:RecipeRecord,body:string}} RecipeEntry */
/** @typedef {{researchId:string,catalogId:string,slug:string,targetPath:string,beforeSha256:string,proposedRecord:RecipeRecord}} Plan */
/** @typedef {{status:string,independentReview:string,applicationApproved:boolean,openIssues:string[],formulaDecision:string,identityDecision:string,findings:{text:string,sourceIds:string[],locator:string}[]}} Decision */
/** @typedef {{bodyDisposition:string,changes:{path:string,before:{present:boolean,value?:unknown},after:{present:boolean,value?:unknown}}[]}} Diff */
/** @param {RecipeRecord} record */
export const editorialEligible=record=>['candidate','draft','review'].includes(record.editorial.status);
/** @param {RecipeRecord} record */
export function issues(record){
 return [!record.timing?'Tempi incompleti o non quantificati':null,!record.servings?'Porzioni mancanti':null,!record.ingredients.length?'Ingredienti mancanti':null,!record.steps.length?'Procedimento mancante':null,!record.sources.some(s=>s.kind!=='internal')?'Nessuna fonte esterna verificabile':null,record.demo?'Demo non verificato: non è una formula editoriale approvata':null,record.duplicateOf?'Possibile duplicato da risolvere':null].filter(Boolean);
}
export function editorialData(){
 /** @type {RecipeEntry[]} */
 const catalog=readCatalog().filter(e=>e.collection==='ricette' && editorialEligible(e.data));
 /** @type {{plans:Plan[]}} */
 const {plans}=JSON.parse(readFileSync('docs/editorial/p1.4/enrichments.json','utf8'));
 /** @type {{items:({researchId:string}&Diff)[]}} */
 const {items}=JSON.parse(readFileSync('docs/editorial/p1.6/diffs.json','utf8'));
 const proposals=plans.map(plan=>{
  const record=recipeSchema.parse(plan.proposedRecord);
  /** @type {Decision} */
  const decision=JSON.parse(readFileSync(`docs/editorial/p1.6/${plan.researchId}.json`,'utf8'));
  const operational=catalog.find(e=>e.data.catalogId===plan.catalogId);
  if(!operational || operational.data.slug!==plan.slug)throw new Error('Identità operativa della proposta non risolta');
  const preconditionMatches=createHash('sha256').update(readFileSync(plan.targetPath)).digest('hex')===plan.beforeSha256;
  const diff=items.find(i=>i.researchId===plan.researchId);
  if(!diff)throw new Error('Diff P1.6 mancante');
  return {plan,record,decision,operational,preconditionMatches,diff};
 });
 return {catalog,proposals};
}
