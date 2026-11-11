import {matchesRecipe} from '../lib/search.mjs';
import {recipeSearchText,legacyRegion} from './view.mjs';

// Array facets use AND within and across groups; no translated labels serve as identifiers.
export function matchesCatalogRecipe(record,filters={}) {
  if(!matchesRecipe({text:recipeSearchText(record),region:legacyRegion(record)},filters.query??'',filters.region??'Tutte')) return false;
  for(const [key,actual] of [['continent',record.provenance.continent],['country',record.provenance.country?.code],['potatoRole',record.potatoRole]]) if(filters[key] && filters[key]!==actual) return false;
  for(const key of ['courses','cookingMethods','families','occasions']) if((filters[key]??[]).some(value=>!record.taxonomy[key].includes(value))) return false;
  return (filters.ingredients??[]).every(value=>record.ingredients.some(ingredient=>ingredient.ingredientId===value));
}
