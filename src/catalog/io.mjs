import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {parseDocument} from 'yaml';
import {validateCatalog} from './validate.mjs';

export function parseMarkdown(source) {
  const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if(!match) throw new Error('Frontmatter YAML mancante');
  const document=parseDocument(match[1],{uniqueKeys:true});
  if(document.errors.length) throw document.errors[0];
  return {data:document.toJS(),body:match[2]};
}
export function readEntries(root='src/content') {
  return ['ricette','curiosita','guide'].flatMap(collection=>readdirSync(path.join(root,collection),{recursive:true})
    .filter(file=>file.endsWith('.md'))
    .map(file=>({collection,file:path.join(root,collection,file),...parseMarkdown(readFileSync(path.join(root,collection,file),'utf8'))})));
}
/** @returns {ReturnType<typeof readEntries>} */
export function readCatalog(root='src/content',registryPath='src/catalog/registry.json') {
  return validateCatalog(readEntries(root),JSON.parse(readFileSync(registryPath,'utf8')));
}
