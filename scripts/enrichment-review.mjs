import {readFileSync,writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {readCatalog} from '../src/catalog/io.mjs';
import {reviewInputs,validateReview} from '../src/catalog/enrichment-review.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
const result=validateReview(reviewInputs(),readCatalog(),JSON.parse(readFileSync('src/catalog/registry.json')));
for(const [name,data] of Object.entries(result)){
 const file=`docs/editorial/p1.6/${name}.json`,text=JSON.stringify(data,null,2)+'\n';
 if(values.write)writeFileSync(file,text);else if(readFileSync(file,'utf8')!==text)throw new Error('Artefatto P1.6 obsoleto: '+file);
}
console.log(JSON.stringify(result.report.summary));
