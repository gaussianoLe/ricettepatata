const units={g:'g',kg:'kg',ml:'ml',l:'l',tsp:'cucchiaini',tbsp:'cucchiai',cup:'tazze',piece:'',pinch:'pizzichi'};
/** @param {import('astro/zod').z.infer<typeof import('./schema.mjs').ingredientSchema>} ingredient */
export function formatIngredient(ingredient) {
  const q=ingredient.quantity;
  const amount=q.value===null?'q.b.':`${q.value}${q.max===undefined?'':`–${q.max}`} ${units[q.unit]}`.trim();
  return `${amount} ${ingredient.name}${ingredient.preparation?`, ${ingredient.preparation}`:''}${ingredient.optional?' (facoltativo)':''}`;
}
/** @param {import('astro/zod').z.infer<typeof import('./schema.mjs').recipeSchema>} record */
export function legacyRegion(record) {
  return record.provenance.country?.code==='IT'?'Italia':record.provenance.continent==='europe'?'Europa':'Mondo';
}
/** @param {import('astro/zod').z.infer<typeof import('./schema.mjs').recipeSchema>} record */
export function recipeSearchText(record) {
  return [record.names.italian,record.names.original.text,...record.names.alternatives.map(name=>name.text),record.provenance.continent,record.provenance.country?.name,record.provenance.country?.code,record.provenance.region,...record.provenance.traditions,...Object.values(record.taxonomy).flat(),record.potatoRole,...record.ingredients.flatMap(ingredient=>[ingredient.ingredientId,ingredient.name])].filter(Boolean).join(' ');
}
/** @param {import('astro/zod').z.infer<typeof import('./schema.mjs').recipeSchema>} record */
export function recipeView(record) {
  const prep=record.timing?.prepMinutes??0,cook=record.timing?.cookMinutes??0,rest=record.timing?.restMinutes??0;
  return {title:record.names.italian,description:record.description,country:[record.provenance.region,record.provenance.country?.name].filter(Boolean).join(', '),region:legacyRegion(record),prep,cook,rest,total:prep+cook+rest,servings:record.servings,ingredients:record.ingredients.map(formatIngredient),steps:record.steps.map(step=>step.text),color:record.color};
}
