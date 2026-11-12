import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {readCatalog} from '../src/catalog/io.mjs';
import {integrationInputs,validateIntegration} from '../src/catalog/integration.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
const report=validateIntegration(integrationInputs(),readCatalog(),JSON.parse(readFileSync('src/catalog/registry.json','utf8')));
const file='docs/integration/p1.5/report.json',text=JSON.stringify(report,null,2)+'\n';
if(values.write)writeFileSync(file,text);else if(readFileSync(file,'utf8')!==text)throw new Error('Report P1.5 obsoleto');
console.log(JSON.stringify(report.summary));
