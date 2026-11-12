import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {readCatalog} from '../src/catalog/io.mjs';
import {readEditorialBundle} from '../src/catalog/editorial.mjs';
import {readConsolidation,validateConsolidation,renderConsolidationMatrix} from '../src/catalog/consolidation.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
const root='docs/editorial/p1.4',bundle=readConsolidation(root);
const report=validateConsolidation(bundle,readEditorialBundle(),readCatalog(),JSON.parse(readFileSync('src/catalog/registry.json','utf8')));
for(const [name,text] of Object.entries({'report.json':JSON.stringify(report,null,2)+'\n','source-matrix.md':renderConsolidationMatrix(bundle)})){
 if(values.write)writeFileSync(root+'/'+name,text);
 else if(readFileSync(root+'/'+name,'utf8')!==text)throw new Error('Artefatto P1.4 obsoleto: '+name);
}
console.log(JSON.stringify(report.summary));
