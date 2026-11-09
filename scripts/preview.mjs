import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {deployment} from '../src/lib/config.mjs';
let saved;
try { saved=JSON.parse(readFileSync('.astro/ricettepatata-build.json','utf8')); }
catch { throw new Error('Esegui npm run build oppure npm run build:preview prima di aprire l’anteprima.'); }
const {target, site, base} = deployment(saved.target, {SITE_URL:saved.site, BASE_PATH:saved.base});
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs',import.meta.url)),'preview','--ignore-lock',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,BUILD_TARGET:target,SITE_URL:site,BASE_PATH:base}});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
