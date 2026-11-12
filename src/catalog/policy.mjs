export function isVisible(record,target) {
  if(!['production','preview'].includes(target)) throw new Error('Target sconosciuto');
  if(record.duplicateOf || record.editorial.status==='candidate') return false;
  // Existing demo drafts remain inspectable; real editorial drafts are private in both public targets.
  if(record.editorial.status==='draft' && !record.demo)return false;
  return target==='preview' || record.editorial.status==='published';
}
