import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readCatalog} from '../src/catalog/io.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
import {releaseEntry} from '../editorial/release.mjs';
import {articlePresentation} from '../editorial/presentation.mjs';
import {auditPublicOutput} from '../src/catalog/integration.mjs';
const slugs=['gatto-di-patate','papas-arrugadas-con-mojo'];
export function uxSnapshot(){return Object.fromEntries(slugs.map(slug=>{const release=releaseEntry(slug);return [slug,{seo:release.seo,presentation:articlePresentation(release.entry)}];}));}
export function verifyUX(read=file=>readFileSync(file)){
 const baseline=JSON.parse(read('docs/editorial/p2.1/baseline.json'));
 if(baseline.baseCommit!=='19507b4eabede713ca74f019372c38643945adab')throw new Error('Baseline UX inattesa');
 for(const [file,hash] of Object.entries(baseline.files))if(createHash('sha256').update(read(file)).digest('hex')!==hash)throw new Error('Baseline UX alterata: '+file);
 if(JSON.stringify(uxSnapshot())!==JSON.stringify(JSON.parse(read('docs/editorial/p2.1/presentation.json'))))throw new Error('Presentazione o SEO discordante dal manifest UX');
 return {prepared:2,protectedFiles:Object.keys(baseline.files).length,operationalChanges:0,published:0,gratin:'excluded'};
}
export function auditUX(folder='dist'){
 const entries=slugs.map(slug=>releaseEntry(slug).entry);
 const publicText=readCatalog().filter(e=>isVisible(e.data,'production')||isVisible(e.data,'preview')).map(e=>JSON.stringify(e.data)+'\n'+e.body).join('\n');
 // A shared ingredient word cannot identify a private recipe; its new markup remains forbidden.
 const uniqueIngredientText=Object.values(uxSnapshot()).flatMap(({presentation:p})=>p.ingredients.flatMap(i=>[i.name,i.detail])).filter(text=>text && !publicText.includes(text));
 const texts=Object.values(uxSnapshot()).flatMap(({presentation:p})=>[p.intro,...p.cookingNotes,...p.supplements.flatMap(s=>s.paragraphs)]);
 texts.push(...uniqueIngredientText);
 const markers=[...texts,'ingredient-amount','ingredient-main','supplement-equipment','Dossier di revisione','Tracciabilità della presentazione P2.1','Revisione UX P2.1'];
 return auditPublicOutput([...entries,...markers.map(marker=>({...entries[0],data:{...entries[0].data,description:marker}}))],folder);
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(process.argv.includes('--output')?auditUX():verifyUX(),null,2));
