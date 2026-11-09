import {schemas,registrySchema} from './schema.mjs';

export function validateCatalog(entries,registry) {
  const identities=registrySchema.parse(registry);
  const byId=new Map(), byRoute=new Map(), external=new Map();
  // Retired identities also reserve their routes: an ID cannot silently take over an old URL.
  for(const [catalogId,route] of Object.entries(identities)) {
    const key=`${route.collection}/${route.slug}`;
    if(byRoute.has(key)) throw new Error(`Slug riservato duplicato: ${key}`);
    byRoute.set(key,catalogId);
  }
  const parsed=entries.map(entry=>{
    if(!schemas[entry.collection]) throw new Error(`Raccolta sconosciuta: ${entry.collection}`);
    const data=schemas[entry.collection].parse(entry.data);
    if(byId.has(data.catalogId)) throw new Error(`catalogId duplicato: ${data.catalogId}`);
    const registered=identities[data.catalogId];
    if(!registered || registered.collection!==entry.collection || registered.slug!==data.slug) throw new Error(`Identità/slug non registrati o modificati: ${data.catalogId}`);
    for(const identifier of data.externalIds) {
      const key=JSON.stringify([identifier.namespace,identifier.value]);
      if(external.has(key)) throw new Error(`Identificatore esterno duplicato: ${key}`);
      external.set(key,data.catalogId);
    }
    const parsedEntry={...entry,data};byId.set(data.catalogId,parsedEntry);return parsedEntry;
  });
  for(const {collection,data} of parsed) {
    const recipeRef=(catalogId,label)=>{
      const referenced=byId.get(catalogId);
      if(!referenced || referenced.collection!=='ricette') throw new Error(`${label}: ricetta inesistente ${catalogId}`);
      return referenced.data;
    };
    if(collection==='ricette') {
      if(data.relation.kind==='variant') {
        const primary=recipeRef(data.relation.primaryId,'Variante');
        if(primary.relation.kind!=='primary' || primary.duplicateOf) throw new Error('La variante deve riferirsi a una ricetta principale canonica');
        if(data.editorial.status==='published' && primary.editorial.status!=='published') throw new Error('Una variante pubblicata richiede una principale pubblicata');
      }
      if(data.duplicateOf) {
        const canonical=recipeRef(data.duplicateOf,'Duplicato');
        if(canonical.duplicateOf) throw new Error('Catene e cicli di duplicati non ammessi');
      }
    } else {
      for(const relatedId of data.relatedRecipeIds) {
        const related=recipeRef(relatedId,'Articolo');
        if(data.editorial.status==='published' && (related.editorial.status!=='published' || related.duplicateOf)) throw new Error('Un articolo pubblicato può collegare solo ricette pubblicate canoniche');
      }
    }
  }
  return parsed;
}
