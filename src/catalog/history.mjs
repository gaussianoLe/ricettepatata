import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readCatalog} from './io.mjs';
import {validateCatalog} from './validate.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
// Explicit historical projection. Current catalog validity is checked separately, never replaced.
export function historicalCatalog(){
 const current=readCatalog();
 const snapshot=JSON.parse(readFileSync('docs/integration/p1.5/baseline.json','utf8'));
 if(snapshot.baseCommit!=='d9e11bf7a8bc20b03f68fa6ec42466c44bac8dae')throw new Error('Baseline P1.5 inattesa');
 if(sha(snapshot.registryText)!==snapshot.files['src/catalog/registry.json'] || JSON.stringify(JSON.parse(snapshot.registryText))!==JSON.stringify(snapshot.registry))throw new Error('Registro storico incoerente');
 for(const [file,digest] of Object.entries(snapshot.files)){
  if(file==='src/catalog/registry.json')continue;
  if(!/^(docs\/(editorial\/(first-ten|p1\.4)|research\/lotto-01)\/|src\/content\/)/.test(file) || file.split('/').includes('..'))throw new Error('Percorso storico non valido');
  if(sha(readFileSync(file))!==digest)throw new Error('Artefatto storico modificato: '+file);
 }
 const entries=current.filter(e=>Object.hasOwn(snapshot.registry,e.data.catalogId));
 const readHistorical=file=>file==='src/catalog/registry.json'?Buffer.from(snapshot.registryText):readFileSync(file);
 return {entries:validateCatalog(entries,snapshot.registry),registry:snapshot.registry,readHistorical,snapshot};
}
