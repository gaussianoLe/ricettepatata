import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {candidateEntries, identities, recordDigest} from '../release/selection.mjs';
import {recipeSchema} from '../src/catalog/schema.mjs';

// Produce a reviewable, deterministic proposal on stdout. Never write approval files.
// The reviewer is an actual external reviewer, distinct from the recipe author.
export function prepareApproval({reviewer, reviewedAt, publishedAt, approvedBy, approvedAt}) {
  if (typeof reviewer !== 'string' || reviewer.trim().length < 2) throw new Error('Reviewer reale obbligatorio');
  for (const [key,value] of Object.entries({reviewedAt,publishedAt,approvedAt})) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)
      throw new Error('Data ISO valida obbligatoria: '+key);
  }
  if (typeof approvedBy !== 'string' || !approvedBy.trim()) throw new Error('Autore consenso obbligatorio');
  if (reviewedAt > publishedAt || publishedAt > approvedAt) throw new Error('Cronologia editoriale non valida');
  const sources = candidateEntries();
  const entries = sources.map(entry=>{
    if (reviewer.trim().toLowerCase()===entry.data.editorial.author.trim().toLowerCase()) throw new Error('Revisore deve essere indipendente');
    if (entry.data.date>reviewedAt || entry.data.sources.some(src=>src.accessedAt>reviewedAt)) throw new Error('Review precedente a fonti o creazione');
    return {
      collection:'ricette',
      data:recipeSchema.parse({...entry.data,editorial:{...entry.data.editorial,status:'published',reviewer:reviewer.trim(),reviewedAt,publishedAt}}),
      body:entry.body,
    };
  });
  if(entries.length!==2 || entries.some((e,i)=>e.data.catalogId!==identities[i].catalogId)) throw new Error('Identità di rilascio discordanti');
  const recordHashes=Object.fromEntries(entries.map(entry=>[entry.data.catalogId,recordDigest(entry)]));
  return {
    approvedRecords:{formatVersion:1,entries},
    authorization:{formatVersion:1,approved:true,approvedBy:approvedBy.trim(),approvedAt,recordHashes,photographicFallbackAccepted:false}
  };
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  // Explicit named CLI flags rather than guessing identity, dates, or consent.
  const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
    const match=/^--([a-zA-Z]+)=(.*)$/.exec(arg);
    if(!match) throw new Error('Usare --reviewer=... --reviewedAt=YYYY-MM-DD --publishedAt=YYYY-MM-DD --approvedBy=... --approvedAt=YYYY-MM-DD');
    return [match[1],match[2]];
  }));
  const proposal=prepareApproval(args);
  process.stdout.write(JSON.stringify(proposal,null,2)+'\n');
}
