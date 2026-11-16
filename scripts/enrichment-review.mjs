import {readFileSync} from 'node:fs';
import {currentValidationState} from '../src/catalog/validation-cycle.mjs';
import {parseArgs} from 'node:util';
import {readCatalog} from '../src/catalog/io.mjs';
import {reviewInputs,validateReview} from '../src/catalog/enrichment-review.mjs';
const {values}=parseArgs({options:{write:{type:'boolean',default:false}}});
if(values.write)throw new Error('Baseline P1.6 storica: --write non consentito');
const current=readCatalog(),registry=JSON.parse(readFileSync('src/catalog/registry.json'));
const history=currentValidationState(current,registry);
const result=validateReview(reviewInputs(),history.historicalEntries,registry,history.readHistorical);
for(const [name,data] of Object.entries(result)){
 const file=`docs/editorial/p1.6/${name}.json`,text=JSON.stringify(data,null,2)+'\n';
 if(readFileSync(file,'utf8')!==text)throw new Error('Artefatto P1.6 obsoleto: '+file);
}
console.log(JSON.stringify(result.report.summary));
