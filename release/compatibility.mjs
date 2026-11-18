import {readFileSync} from 'node:fs';
import {digest} from './selection.mjs';
// Historical checks still read the exact preserved interface, after checking the current code.
// Only the two explicitly reviewed public interface files are covered; catalog files never are.
export function historicalInterface(file,read=readFileSync){
 const plan=JSON.parse(read('docs/release/p2.2/interfaces.json'));
 if(!['src/layouts/Layout.astro','src/pages/ricette/[id].astro'].includes(file))return read(file);
 const item=plan.files.find(i=>i.file===file);
 if(!item || digest(read(file))!==item.afterSha256)throw new Error('Baseline: interfaccia corrente P2.2 alterata');
 const bytes=read(item.beforeFile);
 if(digest(bytes)!==item.beforeSha256)throw new Error('Baseline: interfaccia storica P2.2 alterata');
 return bytes;
}
export function verifyInterfaces(){
 const plan=JSON.parse(readFileSync('docs/release/p2.2/interfaces.json'));
 if(plan.baseCommit!=='36bd1f3c7a53f1ff8b40fd28b66c0bf367555ff9'||plan.files.length!==2)throw new Error('Piano interfacce inatteso');
 for(const item of plan.files)historicalInterface(item.file);
 return plan;
}
