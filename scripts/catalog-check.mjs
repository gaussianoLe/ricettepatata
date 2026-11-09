import {readCatalog} from '../src/catalog/io.mjs';
const catalog=readCatalog();
const counts={};for(const entry of catalog) counts[entry.data.editorial.status]=(counts[entry.data.editorial.status]??0)+1;
console.log(`Catalogo valido: ${catalog.length} record. Stati: ${JSON.stringify(counts)}`);
