import {reviewedSections} from './release.mjs';
import {formatIngredient} from '../src/catalog/view.mjs';
/** Pure display projection of P1.1, never an import or replacement record.
 * @param {{file:string,body:string,data:import('astro/zod').z.infer<typeof import('../src/catalog/schema.mjs').recipeSchema>}} entry
 */
export function articlePresentation(entry){
 const {data,body,file}=entry;
 const intros={
  'gatto-di-patate':'Un composto di patate lega fiordilatte e salumi in una teglia quadrata.',
  'papas-arrugadas-con-mojo':'Le patate restano intere e con la buccia: dopo la lessatura salata vengono asciugate sul fuoco.',
 };
 const intro=intros[/** @type {keyof typeof intros} */(data.slug)];
 if(!intro)throw new Error('Presentazione P2.1 non autorizzata per questo slug');
 const sections=reviewedSections(body);
 /** @type {{destination:string,source:string,text:string}[]} */
 const trace=[];
 /** @param {string} text @param {string} source @param {string} destination */
 function excerpt(text,source,destination){
  if(!text || !source.includes(text))throw new Error('Estratto P2.1 non presente nella fonte operativa');
  trace.push({destination,source:file,text});return text;
 }
 excerpt(intro,(sections.Introduzione??[]).join('\n'),'article.intro');
 const ingredients=data.ingredients.map(ingredient=>{
  const amount=formatIngredient({...ingredient,name:'',preparation:undefined,optional:false}).trim();
  const methodological=['pangrattato-pirofila','mojo'].includes(ingredient.id);
  const detail=methodological?'':ingredient.preparation??'';
  trace.push({destination:`article.ingredients.${ingredient.id}`,source:`${file}#/ingredients/${ingredient.id}`,text:formatIngredient(ingredient)});
  return {id:ingredient.id,amount,name:ingredient.name,detail,optional:ingredient.optional};
 });
 const cookingNotes=data.slug==='gatto-di-patate'?
  [excerpt('I 20 g elencati restano per la superficie.',data.ingredients.find(i=>i.id==='pangrattato-pirofila')?.preparation??'','article.cookingNotes')]:[];
 const groups=[['equipment','Attrezzatura','Formula e attrezzatura'],['timing','Tempi e limiti','Tempi e limiti'],['allergens','Allergeni','Allergeni'],['variants','Varianti documentate','Varianti documentate'],['storage','Conservazione e riscaldamento','Conservazione e riscaldamento']];
 const supplements=groups.map(([id,title,key])=>{
  const paragraphs=(sections[key]??[]).filter(text=>!text.startsWith('Fonte della formula:')).map(text=>excerpt(text,body,`article.${id}`));
  return {id,title,paragraphs};
 }).filter(group=>group.paragraphs.length);
 return {intro,ingredients,cookingNotes,supplements,trace};
}
