import {createRelease,buildRelease} from '../release/runtime.mjs';
import {serveRelease} from '../release/server.mjs';
const args=process.argv.slice(2);
if(args.some(a=>!['--approved','--base=/','--base=/anteprima/','--base=/magazine/'].includes(a)))throw new Error('Argomento release non consentito');
if(process.env.CI)throw new Error('Usare i test RC temporanei in CI; mai produrre artifact privati persistenti');
let session,server;
try{
 session=createRelease({mode:args.includes('--approved')?'approved':'candidate',base:args.find(a=>a.startsWith('--base='))?.slice(7)??'/'});
 await buildRelease(session);server=await serveRelease(session);
 console.log(`Artefatto ${session.config.mode}: ${session.site}`);
 console.log(`${server.url}ricette/gatto-di-patate/\n${server.url}ricette/papas-arrugadas-con-mojo/`);
 console.log(session.config.mode==='candidate'?'Solo localhost. RC NON distribuibile. Ctrl+C cancella la sessione; nessun deployment.':'Pacchetto statico approvato: trasferimento solo manuale e separatamente autorizzato. Copiare il pacchetto prima di Ctrl+C; nessun deployment eseguito.');
 await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);});
}finally{await server?.stop();session?.cleanup();}
