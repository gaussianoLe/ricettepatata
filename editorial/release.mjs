import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {editorialData} from './data.mjs';
import {recipeSEO} from '../src/catalog/recipe-seo.mjs';
export const releaseIds=Object.freeze(['RP-0011','RP-0080']);
/** Extract existing reviewed plain-text sections, not arbitrary HTML/Markdown. @param {string} body */
export function reviewedSections(body){
 return Object.fromEntries([...body.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(match=>[match[1],match[2].trim().split(/\n\s*\n/).filter(Boolean)]));
}
/** @param {string} slug */
export function releaseEntry(slug){
 const entries=editorialData().catalog;
 const entry=entries.find(e=>e.data.slug===slug && e.data.externalIds.some(id=>id.namespace==='ricettepatata-exploratory-census' && releaseIds.includes(id.value)));
 if(!entry)return null;
 const record=entry.data;
 if(record.editorial.status!=='draft'||record.demo||entry.resolution?.outcome!=='ready_for_independent_review')throw new Error('P2.0 consente solo i due draft reali pronti per review, senza promozioni');
 const researchId=record.externalIds.find(id=>id.namespace==='ricettepatata-exploratory-census')?.value;
 const dossier=JSON.parse(readFileSync(`docs/editorial/p1.9/dossiers/${researchId}.json`,'utf8'));
 if(createHash('sha256').update(readFileSync(entry.file)).digest('hex')!==dossier.operationalSha256)throw new Error('Record diverso dalla formula P1.9: revisione esplicita necessaria');
 const sections=reviewedSections(entry.body);
 // The source's historical migration annotation belongs to the raw record, not the reading template.
 if(sections['Formula e attrezzatura'])sections['Formula e attrezzatura']=sections['Formula e attrezzatura'].filter(text=>!text.startsWith('Fonte della formula:'));
 return {entry,researchId,sections,seo:recipeSEO(record),openIssues:dossier.openIssues};
}
