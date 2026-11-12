import {spawnSync} from 'node:child_process';
import {outputFingerprint} from '../src/catalog/integration.mjs';
import {stableJSON} from '../src/catalog/research/input.mjs';
const before=outputFingerprint();
const result=spawnSync(process.execPath,['scripts/build.mjs',process.argv[2]||'production'],{stdio:'inherit',env:process.env});
if(result.status!==0)process.exit(result.status??1);
if(stableJSON(before)!==stableJSON(outputFingerprint()))throw new Error('Output statico non riproducibile fra build consecutive con gli stessi input');
console.log('Build riproducibile: stessi percorsi e SHA-256 di tutti i file dist.');
