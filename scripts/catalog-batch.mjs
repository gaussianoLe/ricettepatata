import {parseArgs} from 'node:util';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {readCatalog} from '../src/catalog/io.mjs';
import {parseResearchInput} from '../src/catalog/research/input.mjs';
import {pendingBatchReport,prepareResearchBatch,stageResearchBatch} from '../src/catalog/research/batch.mjs';
const {values}=parseArgs({options:{input:{type:'string'},profile:{type:'string'},stage:{type:'string'},'allow-partial':{type:'boolean',default:false}}});
if(!values.input) {
  console.log(JSON.stringify(pendingBatchReport(),null,2));
  if(values.stage || values['allow-partial'])process.exitCode=2;
} else {
  if(!values.profile)throw new Error('Occorre --profile con una mappatura esplicita del dataset fornito');
  const input=parseResearchInput(readFileSync(values.input,'utf8'),path.extname(values.input).slice(1).toLowerCase());
  const batch=prepareResearchBatch(input,JSON.parse(readFileSync(values.profile,'utf8')),readCatalog(),JSON.parse(readFileSync('src/catalog/registry.json','utf8')));
  console.log(JSON.stringify(batch.report,null,2));
  if(values.stage) {
    const output=stageResearchBatch(batch,values.stage,{allowPartial:values['allow-partial']});
    console.error(`Staging esterno: ${output}. Nessun contenuto sorgente importato o pubblicato.`);
  } else if(batch.report.status!=='prepared')process.exitCode=2;
}
