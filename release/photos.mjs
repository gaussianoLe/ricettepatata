import {readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {digest,identities} from './selection.mjs';
/** @typedef {{status:string,file:string,author?:string,license?:string,licenseUrl?:string,sourcePage?:string,commercial?:boolean,adaptation?:boolean,origin?:string,sha256:string,alt:string,caption:string,width:number,height:number}} Photo */
const isGenerated=p=>p?.status==='generated' && p.origin==='openai-image-generation';
/** @param {string} slug @returns {Photo|null} */
export function photoFor(slug){const p=JSON.parse(readFileSync('release/photos.json'))[slug];return p?.status==='licensed'||isGenerated(p)?p:null;}
export function verifiedPhotos(){return identities.flatMap(({slug})=>{
 const p=photoFor(slug);if(!p)return [];
 const folder=realpathSync('release/assets'),file=realpathSync(p.file);
 if(path.dirname(file)!==folder||!p.alt||!p.caption||digest(readFileSync(file))!==p.sha256)throw new Error('Metadati/percorso/hash immagine non verificati');
 if(isGenerated(p)){
  if(p.author||p.license||p.licenseUrl||p.sourcePage||p.commercial!==true||p.adaptation!==true)throw new Error('Immagine generata: provenienza ambigua o metadati impropri');
 }else if(!p.commercial||!p.adaptation||!p.author||!p.license||!/^https:\/\//.test(p.licenseUrl)||!/^https:\/\//.test(p.sourcePage))throw new Error('Licenza/attribuzione foto non verificate');
 return [{slug,...p}];
});}
