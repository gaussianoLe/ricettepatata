import {readdirSync} from 'node:fs';
import path from 'node:path';

// Derive expectations from the source catalog, independently of the rendered cards.
export function contentIds(collection) {
  return readdirSync(path.resolve('src/content', collection), {recursive: true})
    .filter(file => file.endsWith('.md'))
    .map(file => file.replaceAll(path.sep, '/').replace(/\.md$/, ''));
}
