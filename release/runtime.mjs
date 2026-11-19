import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,realpathSync,statSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {candidateEntries,approvedEntries} from './selection.mjs';
import {verifiedPhotos} from './photos.mjs';
import {deployment} from '../src/lib/config.mjs';
import {outputFingerprint,auditPublicOutput,outputFiles} from '../src/catalog/integration.mjs';
import {readCatalog} from '../src/catalog/io.mjs';
const sessions=new WeakSet();
const freeze=value=>{if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const repository=realpathSync(fileURLToPath(new URL('../',import.meta.url)));
export function releaseOptions(options={}){
 if(Object.keys(options).some(k=>!['mode','base'].includes(k)))throw new Error('RC: root/output/host non personalizzabili');
 const mode=options.mode??'candidate';if(!['candidate','approved'].includes(mode))throw new Error('Modalità release non valida');
 if(mode==='approved' && (options.base??'/')!=='/')throw new Error('Artefatto approvato solo per root /');
 return {...deployment('production',{BASE_PATH:options.base??'/',SITE_URL:'https://ricettepatata.it'}),mode};
}
export function createRelease(options={}){
 const config=freeze(releaseOptions(options)),entries=freeze(config.mode==='approved'?approvedEntries():candidateEntries());
 if(config.mode==='approved'){
  execFileSync('git',['ls-files','--error-unmatch','release/authorization.json','release/approved-records.json'],{cwd:repository,stdio:'pipe'});
  if(execFileSync('git',['status','--porcelain'],{cwd:repository,encoding:'utf8'}).trim())throw new Error('BLOCKED: release approvata richiede modifiche esplicite già committate per review');
 }
 const directory=mkdtempSync(path.join(realpathSync(tmpdir()),'ricettepatata-release-'));
 const workspace=path.join(directory,'workspace'),site=path.join(directory,'site');mkdirSync(workspace);
 if((statSync(directory).mode&0o077)!==0)throw new Error('RC temporanea non privata');
 try{
  const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:repository,encoding:'utf8'}).split('\0').filter(Boolean);
  for(const file of new Set(files)){
   if(file==='node_modules'||file.startsWith('node_modules/'))continue;
   if(file.split('/').includes('..') || path.isAbsolute(file) || realpathSync(path.join(repository,file))!==path.join(repository,file))throw new Error('Percorso/symlink sorgente RC non consentito');
   const destination=path.join(workspace,file);mkdirSync(path.dirname(destination),{recursive:true});writeFileSync(destination,readFileSync(path.join(repository,file)));
  }
  symlinkSync(path.join(repository,'node_modules'),path.join(workspace,'node_modules'),'dir');
  if(config.mode==='approved')for(const entry of entries)writeFileSync(path.join(workspace,entry.file),`---\n${JSON.stringify(entry.data,null,2)}\n---\n${entry.body}`);
 }catch(error){rmSync(directory,{recursive:true,force:true});throw error;}
 let removed=false,session;
 const cleanup=()=>{if(!removed){rmSync(directory,{recursive:true,force:true});removed=true;sessions.delete(session);process.off('exit',cleanup);}};
 process.once('exit',cleanup);
 session=Object.freeze({config,directory,workspace,site,entries,cleanup});sessions.add(session);return session;
}
function releasePlugin(session){
 const ids=session.entries.map(e=>e.data.catalogId),root=session.workspace;
 const matches=(source,importer,file)=>{if(!source.startsWith('.'))return false;const resolved=path.resolve(path.dirname(importer?.split('?')[0]??root),source);return resolved===path.join(root,file)||resolved+'.ts'===path.join(root,file);};
 return {name:'explicit-isolated-release',enforce:'pre',resolveId(source,importer){
  for(const [file,id] of [['src/catalog/public-store.mjs','store'],['src/catalog/collections.ts','collections'],['release/context.mjs','context']])if(matches(source,importer,file))return '\0release-'+id;
 },load(id){
  if(id==='\0release-context')return `export const releaseCandidate=${session.config.mode==='candidate'};export const releaseArtifact=true;`;
  const allow=`const ids=new Set(${JSON.stringify(ids)});`;
  if(id==='\0release-store')return `${allow}export function publicStore(store){for(const e of store.values())if(!ids.has(e.data.catalogId))store.delete(e.id);return {...store,set(entry){if(!ids.has(entry.data.catalogId)){store.delete(entry.id);return false;}return store.set(entry);}};}`;
  if(id==='\0release-collections')return `import {getCollection} from 'astro:content';${allow}export async function visibleCollection(name){return getCollection(name,e=>ids.has(e.data.catalogId));}`;
 }};
}
export async function buildRelease(session){
 if(!sessions.has(session)||realpathSync(session.directory)!==session.directory||realpathSync(session.workspace)!==session.workspace||session.site!==path.join(session.directory,'site'))throw new Error('Sessione release non autentica o output condiviso');
 const beforeCwd=process.cwd(),beforeEnv={BUILD_TARGET:process.env.BUILD_TARGET,BASE_PATH:process.env.BASE_PATH,SITE_URL:process.env.SITE_URL};
 const {build}=await import('astro');const {default:sitemap}=await import('@astrojs/sitemap');const {default:tailwind}=await import('@tailwindcss/vite');const {default:sharp}=await import('sharp');
 try{
  process.chdir(session.workspace);process.env.BUILD_TARGET='production';process.env.BASE_PATH=session.config.base;process.env.SITE_URL=session.config.site;
  for(const p of verifiedPhotos()){
   const media=path.join(session.workspace,'public/media');mkdirSync(media,{recursive:true});
   const metadata=await sharp(p.file).metadata();if(metadata.width!==p.width||metadata.height!==p.height||p.width<1280)throw new Error('Dimensioni foto discordanti o insufficienti per gli asset previsti');
   writeFileSync(path.join(media,'ATTRIBUTION.txt'),`${p.status==='generated'?'Illustrazione generata con AI — nessuna fotografia reale o licenza CC attribuita':`${p.author} — ${p.sourcePage} — ${p.license}: ${p.licenseUrl}`}. Ridimensionamento/conversione; crop della variante social.\n`);
   for(const width of [480,800,1280])for(const format of ['avif','webp','jpg'])await sharp(p.file).rotate().resize({width,withoutEnlargement:true}).toFormat(format==='jpg'?'jpeg':format,{quality:format==='avif'?55:80}).toFile(path.join(media,`${p.slug}-${width}.${format}`));
   await sharp(p.file).rotate().resize(1200,630,{fit:'cover'}).jpeg({quality:82}).toFile(path.join(media,`${p.slug}-social.jpg`));
  }
  await build({configFile:false,root:pathToFileURL(session.workspace+'/'),site:session.config.site,base:session.config.base,output:'static',trailingSlash:'always',outDir:session.site,cacheDir:path.join(session.directory,'cache'),integrations:[sitemap({filter:page=>!page.endsWith('/404/')})],vite:{cacheDir:path.join(session.directory,'vite'),plugins:[releasePlugin(session),tailwind()],define:{'import.meta.env.BUILD_TARGET':JSON.stringify('production')}}});
  const excluded=readCatalog().filter(e=>!session.entries.some(s=>s.data.catalogId===e.data.catalogId));
  auditPublicOutput(excluded.map(e=>({...e,data:{...e.data,steps:e.data.steps??[],sources:e.data.sources.filter(s=>s.kind!=='internal' && !session.entries.some(a=>a.data.sources.some(source=>source.url.includes(s.url))))}})),session.site);
  for(const file of outputFiles(session.site)){const relative=path.relative(session.site,file).replaceAll('\\','/');
   if(!/^(?:index\.html|404\.html|robots\.txt|favicon\.svg|sitemap-(?:index|0)\.xml|ricette\/index\.html|curiosita\/index\.html|guide\/index\.html|_astro\/[^/]+\.(?:css|js)|media\/(?:ATTRIBUTION\.txt|(?:gatto-di-patate|papas-arrugadas-con-mojo)-(?:480|800|1280|social)\.(?:jpg|webp|avif))|ricette\/(?:gatto-di-patate|papas-arrugadas-con-mojo)\/index\.html)$/.test(relative))throw new Error('File estraneo al rilascio autorizzato: '+relative);
   const content=readFileSync(file);for(const marker of ['Dossier di revisione','EDITORIAL_TEST_OUTPUT','editorialData','Tracciabilità della presentazione P2.1'])if(content.includes(Buffer.from(marker)))throw new Error('Dossier privato nell’artefatto RC');
  }
  const html=readFileSync(path.join(session.site,'ricette/gatto-di-patate/index.html'),'utf8');
  if(!html.includes('data-recipe-article') || (session.config.mode==='candidate' && !html.includes('noindex')))throw new Error('Template pubblico P2.1 o noindex RC non applicati');
  writeFileSync(path.join(session.directory,'artifact.json'),JSON.stringify({mode:session.config.mode,deployable:session.config.mode==='approved',base:session.config.base,site:session.config.site,ids:session.entries.map(e=>e.data.catalogId),fingerprint:outputFingerprint(session.site)},null,2));
  return outputFingerprint(session.site);
 }finally{
  process.chdir(beforeCwd);for(const [key,value] of Object.entries(beforeEnv))value===undefined?delete process.env[key]:process.env[key]=value;
 }
}
