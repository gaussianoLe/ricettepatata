import {photoFor} from './photos.mjs';
import {articlePresentation} from '../editorial/presentation.mjs';
import {recipeSEO} from '../src/catalog/recipe-seo.mjs';
export function reader(entry,base='/'){
 const presentation=articlePresentation(entry),seo=recipeSEO(entry.data,base);
 seo.description=presentation.intro;seo.schema.description=presentation.intro;
 seo.schema.recipeIngredient=presentation.ingredients.map(i=>`${i.amount} ${i.name}${i.detail?', '+i.detail:''}${i.optional?' (facoltativo)':''}`);
 seo.schema.author={'@type':'Organization',name:'RicettePatata.it',url:'https://ricettepatata.it/'};
 const image=photoFor(entry.data.slug)?new URL(`${base}media/${entry.data.slug}-social.jpg`,'https://ricettepatata.it').href:null;
 return {presentation,seo:{...seo,schema:{...seo.schema,...(image?{image:[image]}:{})}}};
}
