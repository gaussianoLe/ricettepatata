export const normalizeName=value=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('it').match(/[\p{L}\p{N}]+/gu)?.join(' ')??'';
const generic=new Set(['patata','patate','potato','potatoes','with','recipe','ricetta','della','delle']);
export function nameSignatures(record) {
  return [...new Set([record.names.italian,record.names.original.text,...record.names.alternatives.map(name=>name.text)].map(normalizeName).filter(Boolean))];
}
export function relatedNames(one,two) {
  if(one.some(name=>two.includes(name)))return 'EXACT_NORMALIZED_NAME';
  for(const a of one)for(const b of two) {
    const x=new Set(a.split(' ').filter(word=>word.length>=4 && !generic.has(word)));
    const y=new Set(b.split(' ').filter(word=>word.length>=4 && !generic.has(word)));
    const overlap=[...x].filter(word=>y.has(word)).length;
    if(overlap && overlap/(new Set([...x,...y]).size)>=0.5)return 'SIMILAR_NAME';
  }
  return null;
}
