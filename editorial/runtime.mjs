import {mkdtempSync,mkdirSync,realpathSync,rmSync,statSync,symlinkSync,existsSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const repository=realpathSync(fileURLToPath(new URL('../',import.meta.url)));
const loopback=host=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(host);
export function editorialOptions(options={},env={}){
 if(Object.keys(options).some(k=>!['target','host','port'].includes(k)))throw new Error('Opzione editoriale non consentita; output/root/config non personalizzabili');
 const target=options.target??'editorial',host=options.host??'127.0.0.1',port=Number(options.port??4322);
 if(target!=='editorial' || (env.BUILD_TARGET && env.BUILD_TARGET!=='editorial'))throw new Error('Target locale richiesto: editorial');
 if(host!=='127.0.0.1' || (env.HOST && env.HOST!=='127.0.0.1'))throw new Error('Solo binding 127.0.0.1 consentito');
 if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Porta editoriale non valida');
 if(env.BASE_PATH && env.BASE_PATH!=='/')throw new Error('BASE_PATH editoriale deve essere /');
 if(env.SITE_URL && env.SITE_URL!==`http://127.0.0.1:${port}`)throw new Error('SITE_URL editoriale deve corrispondere al loopback locale');
 return {target,host,port};
}
export function allowedRequest({remoteAddress,host,origin,method,url},port){
 if(!loopback(remoteAddress)||!['GET','HEAD'].includes(method))return false;
 const allowed=new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
 if(!allowed.has(host) || (origin && ![...allowed].some(h=>origin===`http://${h}`)))return false;
 let pathname;try{pathname=decodeURIComponent(new URL(url,'http://127.0.0.1').pathname);}catch{return false;}
 return !(/(?:^|\/)(?:@fs|\.git|\.env)(?:\/|$)|\.(?:md|json)(?:$|\?)/i.test(pathname));
}
export function assertTestSession(output,url){
 const parent=realpathSync(tmpdir()),directory=path.dirname(output);
 if(path.basename(output)!=='test-results' || path.dirname(directory)!==parent || !/^ricettepatata-editorial-[A-Za-z0-9]+$/.test(path.basename(directory)) || realpathSync(directory)!==directory || (statSync(directory).mode&0o077)!==0 || (existsSync(output)&&(lstatSync(output).isSymbolicLink()||realpathSync(output)!==output)))throw new Error('Output test editoriale non isolato');
 const address=new URL(url);if(address.protocol!=='http:'||address.hostname!=='127.0.0.1'||address.pathname!=='/'||address.search||address.hash||address.username||address.password)throw new Error('URL test editoriale non locale');
}
export function createSession(){
 const parent=realpathSync(tmpdir()),directory=mkdtempSync(path.join(parent,'ricettepatata-editorial-'));
 // mkdtemp is private (0700); no user-selected path is ever recursively deleted.
 if((statSync(directory).mode&0o077)!==0)throw new Error('Directory temporanea non privata');
 for(const name of ['root','cache','empty-public'])mkdirSync(path.join(directory,name));
 symlinkSync(path.join(repository,'node_modules'),path.join(directory,'root/node_modules'),'dir');
 let removed=false;
 const onExit=()=>cleanup();
 function cleanup(){if(!removed){rmSync(directory,{recursive:true,force:true});removed=true;process.off('exit',onExit);}}
 process.once('exit',onExit);
 return {directory,cleanup};
}
export function assertSessionConfig(config,session,options){
 const location=value=>fileURLToPath(value);
 if(location(config.srcDir)!==fileURLToPath(new URL('./src/',import.meta.url)) || location(config.root)!==path.join(session.directory,'root')+path.sep || location(config.cacheDir)!==path.join(session.directory,'cache')+path.sep || location(config.outDir)!==path.join(session.directory,'forbidden-output')+path.sep || location(config.publicDir)!==path.join(session.directory,'empty-public')+path.sep || config.server.host!=='127.0.0.1' || config.server.port!==options.port || config.base!=='/')throw new Error('Configurazione editoriale non isolata');
}
export function privateConfig(session,options){
 const directory=name=>pathToFileURL(path.join(session.directory,name)+path.sep);
 return {
  configFile:false,root:directory('root'),srcDir:fileURLToPath(new URL('./src/',import.meta.url)),publicDir:fileURLToPath(directory('empty-public')),cacheDir:fileURLToPath(directory('cache')),outDir:fileURLToPath(directory('forbidden-output')),base:'/',site:`http://127.0.0.1:${options.port}`,output:'static',trailingSlash:'always',devToolbar:{enabled:false},server:{host:'127.0.0.1',port:options.port,open:false},
  integrations:[{name:'local-editorial-only',hooks:{
   'astro:config:setup':({command})=>{if(command!=='dev')throw new Error('Editorial consente solo dev: build/preview/sync vietati');},
   'astro:config:done':({config})=>assertSessionConfig(config,session,options),
   'astro:server:start':({address})=>{if(address.address!=='127.0.0.1')throw new Error('Binding editoriale non locale');},
  }}],
  vite:{cacheDir:path.join(session.directory,'vite'),server:{host:'127.0.0.1',port:options.port,strictPort:true,allowedHosts:['127.0.0.1','localhost'],cors:false,fs:{strict:true,allow:[repository,session.directory]}},plugins:[{name:'editorial-loopback-guard',enforce:'pre',configResolved(config){if(config.server.host!=='127.0.0.1'||path.resolve(config.cacheDir)!==path.join(session.directory,'vite'))throw new Error('Cache o host Vite editoriali non isolati');},configureServer(server){
   server.middlewares.use((req,res,next)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
    if(!allowedRequest({remoteAddress:req.socket.remoteAddress,host:req.headers.host,origin:req.headers.origin,method:req.method,url:req.url},options.port)){res.statusCode=403;res.end('Accesso editoriale locale rifiutato');return;}
    next();
   });
  }}]},
 };
}
export async function startEditorial(options={},env=process.env){
 const resolved=editorialOptions(options,env),session=createSession();
 let server;
 try{
  const {dev}=await import('astro');server=await dev(privateConfig(session,resolved));
  if(server.address.address!=='127.0.0.1'||server.address.port!==resolved.port)throw new Error('Indirizzo editoriale inatteso');
  return {...session,address:server.address,async stop(){try{await server.stop();}finally{session.cleanup();}}};
 }catch(error){try{await server?.stop();}finally{session.cleanup();}throw error;}
}
