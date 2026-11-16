import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {currentValidationState} from '../src/catalog/validation-cycle.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
const {report,diffs}=currentValidationState();
for(const [name,data] of Object.entries({report,diffs})){
 const file=`docs/editorial/p1.8/${name}.json`,text=JSON.stringify(data,null,2)+'\n';
 if(values.write)writeFileSync(file,text);else if(readFileSync(file,'utf8')!==text)throw new Error('Artefatto P1.8 obsoleto: '+file);
}
console.log(JSON.stringify(report.summary));
