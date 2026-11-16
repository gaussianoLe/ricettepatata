import {parseArgs} from 'node:util';
import {readFileSync,writeFileSync} from 'node:fs';
import {currentResolution,resolutionInputs} from '../src/catalog/editorial-resolution.mjs';
import {auditPublicOutput} from '../src/catalog/integration.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false},output:{type:'boolean',default:false}}});
const result=currentResolution();
if(values.output){console.log(JSON.stringify(auditPublicOutput([resolutionInputs().alternative.entry])));}
else{
 for(const [name,data] of Object.entries(result)){
  const file=`docs/editorial/p1.9/${name}.json`,text=JSON.stringify(data,null,2)+'\n';
  if(values.write)writeFileSync(file,text);else if(readFileSync(file,'utf8')!==text)throw new Error('Report P1.9 obsoleto: '+file);
 }
 console.log(JSON.stringify(result.report.summary));
}
