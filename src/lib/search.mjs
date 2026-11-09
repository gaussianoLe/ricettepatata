export const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').trim();
export function matchesRecipe(recipe, query, region) {
 return (region === 'Tutte' || recipe.region === region) && normalize(query).split(/\s+/).every(word => normalize(recipe.text).includes(word));
}
