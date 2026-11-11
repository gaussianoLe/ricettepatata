import {getCollection, type CollectionKey} from 'astro:content';
import {isVisible} from './policy.mjs';
export async function visibleCollection<C extends CollectionKey>(collection:C) {
  return getCollection(collection,entry=>isVisible(entry.data,import.meta.env.BUILD_TARGET));
}
