import {defineCollection} from 'astro:content';
import {z} from 'astro/zod';
import {glob} from 'astro/loaders';
const editorial = z.object({title: z.string(), description: z.string(), date: z.coerce.date(), demo: z.literal(true)});
const ricette = defineCollection({loader: glob({pattern: '**/*.md', base: './src/content/ricette'}), schema: editorial.extend({
 country: z.string(), region: z.enum(['Italia','Europa','Mondo']), prep: z.number().int().positive(), cook: z.number().int().positive(), servings: z.number().int().positive(),
 category: z.string(), ingredients: z.array(z.string()).min(2), steps: z.array(z.string()).min(2), color: z.enum(['gold','green','pink']),
})});
const curiosita = defineCollection({loader: glob({pattern: '**/*.md', base: './src/content/curiosita'}), schema: editorial});
const guide = defineCollection({loader: glob({pattern: '**/*.md', base: './src/content/guide'}), schema: editorial});
export const collections = {ricette, curiosita, guide};
