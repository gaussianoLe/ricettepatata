import {readCatalog} from '../../src/catalog/io.mjs';
import {isVisible} from '../../src/catalog/policy.mjs';
export const catalog=readCatalog();
export function visibleEntries(collection,target=process.env.TEST_TARGET||'production') {
  return catalog.filter(entry=>entry.collection===collection && isVisible(entry.data,target));
}
export function contentIds(collection,target=process.env.TEST_TARGET||'production') {
  return visibleEntries(collection,target).map(entry=>entry.data.slug);
}
