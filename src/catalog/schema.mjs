import {z} from 'astro/zod';

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const id = z.uuid().refine(value => value === value.toLowerCase(), 'UUID richiesto in forma minuscola canonica');
const date = z.iso.date();
const unique = schema => z.array(schema).refine(values => new Set(values).size === values.length, 'Valori duplicati');
const language = z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const url = z.url().refine(value => {
  const parsed = new URL(value);
  return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
}, 'Le fonti devono avere URL HTTPS senza credenziali');
export const editorialStates = ['candidate','draft','review','verified','published'];
export const taxonomies = {
  courses: ['antipasto','primo','secondo','contorno','piatto-unico','snack','dolce'],
  cookingMethods: ['bollitura','forno','frittura','padella','vapore','crudo','stufatura','nessuna-cottura'],
  families: ['gnocchi','sformati','patate-arrosto','frittelle','stufati','insalate','zuppe','pane','pasta','altro'],
  occasions: ['quotidiano','festa','aperitivo','pranzo-domenica','street-food','comfort-food','natale','pasqua','estate'],
};
export const sourceSchema = z.strictObject({
  id: slug, kind: z.enum(['primary','secondary','internal']), title: text,
  url, author: text, accessedAt: date,
});
const namesSchema = z.strictObject({
  italian: text,
  original: z.strictObject({text, language}),
  alternatives: z.array(z.strictObject({text, language})),
});
const editorialSchema = z.strictObject({
  status: z.enum(editorialStates), author: text,
  reviewer: text.optional(), reviewedAt: date.optional(), publishedAt: date.optional(),
});
const noteSchema = z.strictObject({
  id: slug, kind: z.enum(['curiosity','history','culture']), text,
  sourceIds: unique(slug).min(1),
});
const common = {
  schemaVersion: z.literal(1), catalogId: id, slug,
  names: namesSchema, description: text, date, demo: z.boolean(), editorial: editorialSchema,
  sources: z.array(sourceSchema), notes: z.array(noteSchema),
  externalIds: z.array(z.strictObject({namespace: slug, value: text})),
};
const quantity = z.union([
  z.strictObject({value: z.number().positive(), max: z.number().positive().optional(), unit: z.enum(['g','kg','ml','l','tsp','tbsp','cup','piece','pinch'])})
    .refine(q => q.max === undefined || q.max >= q.value, 'Intervallo quantità non valido'),
  z.strictObject({value: z.null(), unit: z.literal('qb')}),
]);
export const ingredientSchema = z.strictObject({
  id: slug, ingredientId: slug, name: text, quantity,
  preparation: text.optional(), optional: z.boolean(),
});
const stepSchema = z.strictObject({
  id: slug, text, ingredientIds: unique(slug), minutes: z.number().nonnegative().optional(),
});
const provenance = z.strictObject({
  continent: z.enum(['africa','asia','europe','north-america','south-america','oceania','antarctica']).nullable(),
  country: z.strictObject({code: z.string().regex(/^[A-Z]{2}$/), name: text}).nullable(),
  region: text.nullable(), traditions: unique(text),
});
const taxonomy = z.strictObject(Object.fromEntries(Object.entries(taxonomies).map(([key,values]) => [key, unique(z.enum(values))])));

function repeated(values) { return new Set(values).size !== values.length; }
function checkCommon(record, ctx) {
  const issue = (path,message) => ctx.addIssue({code:'custom',path,message});
  for(const field of ['sources','notes']) {
    if(repeated(record[field].map(value=>value.id))) issue([field], 'Identificatori locali duplicati');
  }
  const sources = new Map(record.sources.map(source=>[source.id,source]));
  for(const [index,note] of record.notes.entries()) {
    for(const sourceId of note.sourceIds) if(!sources.has(sourceId)) issue(['notes',index,'sourceIds'],`Fonte inesistente: ${sourceId}`);
  }
  const status=record.editorial.status;
  if(['verified','published'].includes(status)) {
    if(record.demo) issue(['demo'],'Un demo non può essere verified/published');
    if(!record.editorial.reviewer || record.editorial.reviewer.toLocaleLowerCase('it')===record.editorial.author.toLocaleLowerCase('it')) issue(['editorial','reviewer'],'Richiesto revisore distinto dall’autore');
    if(!record.editorial.reviewedAt) issue(['editorial','reviewedAt'],'Data di verifica obbligatoria');
    if(!record.sources.some(source=>source.kind!=='internal')) issue(['sources'],'Richiesta almeno una fonte esterna verificabile');
    for(const [index,note] of record.notes.entries()) if(!note.sourceIds.some(sourceId=>sources.has(sourceId) && sources.get(sourceId).kind!=='internal')) issue(['notes',index,'sourceIds'],'La nota richiede una fonte esterna');
    if(record.editorial.reviewedAt && (record.editorial.reviewedAt<record.date || record.sources.some(source=>source.accessedAt>record.editorial.reviewedAt))) issue(['editorial','reviewedAt'],'La verifica deve seguire la creazione e la consultazione delle fonti');
  }
  if(status==='published') {
    if(!record.editorial.publishedAt || record.editorial.publishedAt<record.editorial.reviewedAt) issue(['editorial','publishedAt'],'Pubblicazione obbligatoria, successiva alla verifica');
  } else if(record.editorial.publishedAt) issue(['editorial','publishedAt'],'Solo published ammette una data di pubblicazione');
}

export const recipeSchema = z.strictObject({
  ...common,
  provenance, taxonomy,
  potatoRole: z.enum(['protagonist','secondary']),
  relation: z.discriminatedUnion('kind',[
    z.strictObject({kind:z.literal('primary')}),
    z.strictObject({kind:z.literal('variant'), primaryId:id}),
  ]),
  duplicateOf: id.optional(),
  timing: z.strictObject({prepMinutes:z.number().int().nonnegative(),cookMinutes:z.number().int().nonnegative(),restMinutes:z.number().int().nonnegative()}).nullable(),
  servings: z.number().positive().nullable(),
  ingredients: z.array(ingredientSchema), steps: z.array(stepSchema),
  color: z.enum(['gold','green','pink']),
}).superRefine((record,ctx)=>{
  checkCommon(record,ctx);
  const issue = (path,message) => ctx.addIssue({code:'custom',path,message});
  if(repeated(record.ingredients.map(value=>value.id))) issue(['ingredients'],'Identificatori ingrediente duplicati');
  if(repeated(record.steps.map(value=>value.id))) issue(['steps'],'Identificatori passaggio duplicati');
  const ingredientIds = new Set(record.ingredients.map(value=>value.id));
  for(const [index,step] of record.steps.entries()) for(const ingredientId of step.ingredientIds) if(!ingredientIds.has(ingredientId)) issue(['steps',index,'ingredientIds'],`Ingrediente inesistente: ${ingredientId}`);
  if(record.editorial.status!=='candidate') {
    if(!record.provenance.country || !record.provenance.continent) issue(['provenance'],'Paese e continente obbligatori oltre candidate');
    if(!record.timing || !record.servings) issue(['timing'],'Tempi e porzioni obbligatori oltre candidate');
    if(record.ingredients.length<2 || record.steps.length<2) issue(['ingredients'],'Richiesti almeno due ingredienti e due passaggi');
    if(!record.ingredients.some(ingredient=>ingredient.ingredientId==='patata')) issue(['ingredients'],'La ricetta deve contenere patate');
    for(const field of ['courses','cookingMethods','families']) if(!record.taxonomy[field].length) issue(['taxonomy',field],'Tassonomia obbligatoria oltre candidate');
  }
  if(record.duplicateOf===record.catalogId || (record.relation.kind==='variant' && record.relation.primaryId===record.catalogId)) issue(['relation'],'Una ricetta non può riferirsi a sé stessa');
  if(record.duplicateOf && ['verified','published'].includes(record.editorial.status)) issue(['duplicateOf'],'Un duplicato non può essere verificato o pubblicato');
});
export const articleSchema = z.strictObject({
  ...common, topics: unique(slug).min(1), relatedRecipeIds: unique(id),
}).superRefine(checkCommon);
export const schemas = {ricette:recipeSchema, curiosita:articleSchema, guide:articleSchema};
export const registrySchema = z.record(id,z.strictObject({collection:z.enum(['ricette','curiosita','guide']),slug}));
