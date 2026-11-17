import {deployment,withBase} from '../lib/config.mjs';
import {formatIngredient} from './view.mjs';
/** Preparation only: the caller must enforce visibility before rendering any page.
 * No publication metadata, totals, images, ratings or nutrition are inferred.
 * @param {import('astro/zod').z.infer<typeof import('./schema.mjs').recipeSchema>} record
 * @param {string} base
 */
export function recipeSEO(record,base='/'){
 const config=deployment('production',{BASE_PATH:base,SITE_URL:'https://ricettepatata.it'});
 const canonical=new URL(withBase(`ricette/${record.slug}/`,config.base),config.site).href;
 const schema={
  '@context':'https://schema.org','@type':'Recipe',name:record.names.italian,
  alternateName:[record.names.original.text,...record.names.alternatives.map(n=>n.text)].filter((n,i,a)=>n!==record.names.italian && a.indexOf(n)===i),
  description:record.description,inLanguage:'it-IT',url:canonical,
  ...(record.editorial.publishedAt?{datePublished:record.editorial.publishedAt}:{}),
  author:{'@type':'Organization',name:record.editorial.author},
  ...(record.provenance.traditions.length?{recipeCuisine:record.provenance.traditions}:{}),
  ...(record.taxonomy.courses.length?{recipeCategory:record.taxonomy.courses}:{}),
  ...(record.servings!==null?{recipeYield:`${record.servings} porzioni`}:{}),
  ...(record.timing?{prepTime:`PT${record.timing.prepMinutes}M`,cookTime:`PT${record.timing.cookMinutes}M`}:{}),
  recipeIngredient:record.ingredients.map(formatIngredient),
  recipeInstructions:record.steps.map((step,i)=>({'@type':'HowToStep',position:i+1,text:step.text})),
  citation:record.sources.map(source=>source.url),
 };
 const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
  {name:'Home',url:new URL(config.base,config.site).href},
  {name:'Ricette',url:new URL(withBase('ricette/',config.base),config.site).href},
  {name:record.names.italian,url:canonical},
 ].map((item,i)=>({'@type':'ListItem',position:i+1,name:item.name,item:item.url}))};
 return {title:record.names.italian,description:record.description,canonical,schema,breadcrumb};
}
