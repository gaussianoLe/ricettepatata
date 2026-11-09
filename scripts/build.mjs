import {mkdirSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadEnv} from 'vite';
import {deployment} from '../src/lib/config.mjs';
const target = process.argv[2] || 'production';
const config = deployment(target, {...loadEnv(target, process.cwd(), ''), ...process.env});
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)), 'build', '--mode', target], {stdio:'inherit', env:{...process.env, BUILD_TARGET:target}});
if (result.status === 0) {
 mkdirSync('.astro', {recursive:true});
 writeFileSync('.astro/ricettepatata-build.json', JSON.stringify(config));
}
process.exit(result.status ?? 1);
