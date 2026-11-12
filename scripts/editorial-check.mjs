import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {readCatalog} from '../src/catalog/io.mjs';
import {readEditorialBundle,validateEditorialBundle,renderSourceMatrix} from '../src/catalog/editorial.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
const root='docs/editorial/first-ten',bundle=readEditorialBundle(root);
const report=validateEditorialBundle(bundle,readFileSync('docs/research/lotto-01/dataset.json','utf8'),readCatalog(),JSON.parse(readFileSync('src/catalog/registry.json','utf8')));
const preserved=JSON.parse(readFileSync(root+'/preserved-catalog.json','utf8'));
for(const [file,digest] of Object.entries(preserved))if(createHash('sha256').update(readFileSync(file)).digest('hex')!==digest)throw new Error('Contenuto/registro modificato: '+file);
const outputs={'report.json':JSON.stringify(report,null,2)+'\n','source-matrix.md':renderSourceMatrix(bundle)};
for(const [file,text] of Object.entries(outputs)){
  if(values.write)writeFileSync(root+'/'+file,text);
  else if(readFileSync(root+'/'+file,'utf8')!==text)throw new Error(`Artefatto obsoleto: ${file}; riesaminare e rigenerare con npm run editorial:check -- --write`);
}
console.log(JSON.stringify(report.summary));
