import {realpathSync,statSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
export function assertTestSession(output,url){
 if(!output||!url)throw new Error('Usare npm run test:release in una sessione temporanea');
 const directory=path.dirname(output),parsed=new URL(url);
 if(path.basename(output)!=='test-results'||path.dirname(directory)!==realpathSync(tmpdir())||!/^ricettepatata-release-[A-Za-z0-9]+$/.test(path.basename(directory))||realpathSync(directory)!==directory||(statSync(directory).mode&0o077)!==0||parsed.hostname!=='127.0.0.1'||parsed.protocol!=='http:')throw new Error('Output/URL test RC non isolati');
}
