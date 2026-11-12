import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {historicalCatalog} from '../src/catalog/history.mjs';
import {readEditorialBundle,validateEditorialBundle,renderSourceMatrix} from '../src/catalog/editorial.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
if(values.write)throw new Error('P1.3 è una baseline storica immutabile; creare una nuova edizione');
const root='docs/editorial/first-ten',bundle=readEditorialBundle(root);
const historical=historicalCatalog();
const report=validateEditorialBundle(bundle,readFileSync('docs/research/lotto-01/dataset.json','utf8'),historical.entries,historical.registry);
const preserved=JSON.parse(readFileSync(root+'/preserved-catalog.json','utf8'));
for(const [file,digest] of Object.entries(preserved))if(createHash('sha256').update(historical.readHistorical(file)).digest('hex')!==digest)throw new Error('Contenuto/registro modificato: '+file);
const outputs={'report.json':JSON.stringify(report,null,2)+'\n','source-matrix.md':renderSourceMatrix(bundle)};
for(const [file,text] of Object.entries(outputs)){
  if(values.write)writeFileSync(root+'/'+file,text);
  else if(readFileSync(root+'/'+file,'utf8')!==text)throw new Error(`Artefatto obsoleto: ${file}; riesaminare e rigenerare con npm run editorial:check -- --write`);
}
console.log(JSON.stringify(report.summary));
