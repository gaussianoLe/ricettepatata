import {readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {digest,identities} from './selection.mjs';
/** @typedef {{status:string,file:string,author:string,license:string,licenseUrl:string,sourcePage:string,commercial:boolean,adaptation:boolean,sha256:string,alt:string,caption:string,width:number,height:number}} Photo */
/** @param {string} slug @returns {Photo|null} */
export function photoFor(slug){const p=JSON.parse(readFileSync('release/photos.json'))[slug];return p?.status==='licensed'?p:null;}
export function verifiedPhotos(){return identities.flatMap(({slug})=>{
 const p=photoFor(slug);if(!p)return [];
 const folder=realpathSync('release/assets'),file=realpathSync(p.file);
 if(path.dirname(file)!==folder||!p.commercial||!p.adaptation||!p.author||!p.alt||!p.caption||!p.license||!/^https:\/\//.test(p.licenseUrl)||!/^https:\/\//.test(p.sourcePage)||digest(readFileSync(file))!==p.sha256)throw new Error('Licenza/attribuzione/percorso foto non verificati');
 return [{slug,...p}];
});}
