export function isVisible(record,target) {
  if(!['production','preview'].includes(target)) throw new Error('Target sconosciuto');
  if(record.duplicateOf || record.editorial.status==='candidate') return false;
  return target==='preview' || record.editorial.status==='published';
}
