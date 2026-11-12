import {defineCollection} from 'astro:content';
import {glob, type Loader} from 'astro/loaders';
import {publicStore} from './catalog/public-store.mjs';
import {recipeSchema,articleSchema} from './catalog/schema.mjs';
const loader=(collection:string):Loader=>{
 const source=glob({pattern:'**/*.md',base:`./src/content/${collection}`,generateId:({data})=>String(data.slug)});
 return {...source,name:`public-${collection}`,async load(context){
  const store=publicStore(context.store,process.env.BUILD_TARGET || 'production');
  await source.load({...context,store});
 }};
};
export const collections = {
  ricette:defineCollection({loader:loader('ricette'),schema:recipeSchema}),
  curiosita:defineCollection({loader:loader('curiosita'),schema:articleSchema}),
  guide:defineCollection({loader:loader('guide'),schema:articleSchema}),
};
