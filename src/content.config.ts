import {defineCollection} from 'astro:content';
import {glob} from 'astro/loaders';
import {recipeSchema,articleSchema} from './catalog/schema.mjs';
const loader=(collection:string)=>glob({pattern:'**/*.md',base:`./src/content/${collection}`,generateId:({data})=>String(data.slug)});
export const collections = {
  ricette:defineCollection({loader:loader('ricette'),schema:recipeSchema}),
  curiosita:defineCollection({loader:loader('curiosita'),schema:articleSchema}),
  guide:defineCollection({loader:loader('guide'),schema:articleSchema}),
};
