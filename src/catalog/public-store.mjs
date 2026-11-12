import {isVisible} from './policy.mjs';
/** A loader-level gate; excluded entries never enter the persisted content store. */
export function publicStore(store,target){
 if(!['production','preview'].includes(target))throw new Error('Target sconosciuto');
 for(const entry of store.values())if(!isVisible(entry.data,target))store.delete(entry.id);
 return {...store,set(entry){
  if(!isVisible(entry.data,target)){store.delete(entry.id);return false;}
  return store.set(entry);
 }};
}
