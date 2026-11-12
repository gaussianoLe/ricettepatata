import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {historicalCatalog} from '../src/catalog/history.mjs';
import {readEditorialBundle} from '../src/catalog/editorial.mjs';
import {readConsolidation,validateConsolidation,renderConsolidationMatrix} from '../src/catalog/consolidation.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
if(values.write)throw new Error('P1.4 è una baseline storica immutabile; creare una nuova edizione');
const root='docs/editorial/p1.4',bundle=readConsolidation(root);
const historical=historicalCatalog();
const report=validateConsolidation(bundle,readEditorialBundle(),historical.entries,historical.registry,historical.readHistorical);
for(const [name,text] of Object.entries({'report.json':JSON.stringify(report,null,2)+'\n','source-matrix.md':renderConsolidationMatrix(bundle)})){
 if(values.write)writeFileSync(root+'/'+name,text);
 else if(readFileSync(root+'/'+name,'utf8')!==text)throw new Error('Artefatto P1.4 obsoleto: '+name);
}
console.log(JSON.stringify(report.summary));
