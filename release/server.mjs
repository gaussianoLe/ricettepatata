import {createServer} from 'node:http';
import {readFileSync,statSync,existsSync} from 'node:fs';
import path from 'node:path';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif'};
export async function serveRelease(session,port=4323){
 if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Porta non valida');
 const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('X-Content-Type-Options','nosniff');
  const host=req.headers.host;
  if(!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!['GET','HEAD'].includes(req.method)||![`127.0.0.1:${port}`,`localhost:${port}`].includes(host)||(req.headers.origin&&!['http://'+host].includes(req.headers.origin))){res.writeHead(403);res.end();return;}
  let filename;
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   if(!pathname.startsWith(session.config.base))throw new Error();
   const relative=pathname.slice(session.config.base.length);filename=path.resolve(session.site,relative||'index.html');
   if(!filename.startsWith(session.site+path.sep))throw new Error();
   if(existsSync(filename)&&statSync(filename).isDirectory())filename=path.join(filename,'index.html');
   if(!existsSync(filename)||!statSync(filename).isFile())throw new Error();
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(readFileSync(path.join(session.site,'404.html')));return;}
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]??'application/octet-stream'});res.end(req.method==='HEAD'?undefined:readFileSync(filename));
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {url:`http://127.0.0.1:${port}${session.config.base}`,stop:()=>new Promise(resolve=>server.close(resolve))};
}
