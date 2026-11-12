import {test,expect} from '@playwright/test';
import {editorialData} from '../../editorial/data.mjs';
const {catalog,proposals}=editorialData();
test('local index lists operational drafts and all three unapplied candidate proposals',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('Revisione editoriale');
 await expect(page.getByText('La visualizzazione non costituisce approvazione.',{exact:false})).toBeVisible();
 for(const recipe of catalog)await expect(page.locator(`a[href="/recipes/${recipe.data.catalogId}/"]`)).toBeVisible();
 for(const p of proposals)await expect(page.locator(`a[href="/enrichments/${p.plan.researchId}/"]`)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('real private drafts show quantities, procedure, sources and identity locally',async({page})=>{
 for(const recipe of catalog.filter(e=>!e.data.demo)){
  await page.goto(`/recipes/${recipe.data.catalogId}/`);
  await expect(page.locator('[data-editorial-record]')).toHaveAttribute('data-catalog-id',recipe.data.catalogId);
  await expect(page.getByText('RICETTA REALE',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Ingredienti e quantità',exact:true})).toBeVisible();
  if(recipe.data.steps.length)await expect(page.locator('ol')).toContainText(recipe.data.steps[0].text);
  else await expect(page.getByText('Procedimento mancante',{exact:true})).toBeVisible();
  if(recipe.data.sources.length)await expect(page.locator(`a[href="${recipe.data.sources[0].url}"]`)).toBeVisible();
  await expect(page.getByText(recipe.data.slug,{exact:true})).toBeVisible();
 }
});
test('each enrichment compares original demo, candidate, structured changes and unresolved decision',async({page})=>{
 for(const p of proposals){
  await page.goto(`/enrichments/${p.plan.researchId}/`);
  await expect(page.getByRole('heading',{name:'Contenuto operativo attuale',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Proposta di arricchimento · candidate',exact:true})).toBeVisible();
  await expect(page.getByText('Decisione: blocked · NON APPLICATA',{exact:true})).toBeVisible();
  await expect(page.getByText('Applicazione approvata: no.',{exact:false})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Questioni aperte',exact:true})).toBeVisible();
  await expect(page.locator('table')).toContainText('/data/demo');
  if(p.record.timing===null)await expect(page.getByText('Non quantificati: nessuna durata totale inventata',{exact:true})).toBeVisible();
 }
});
test('localhost guard refuses foreign Host/Origin, writes and raw private files',async({request})=>{
 const response=await request.get('/');expect(response.status()).toBe(200);
 expect(response.headers()['cache-control']).toBe('no-store');expect(response.headers()['x-robots-tag']).toContain('noindex');
 expect((await request.get('/',{headers:{host:'foreign.example'}})).status()).toBe(403);
 expect((await request.get('/',{headers:{origin:'https://foreign.example'}})).status()).toBe(403);
 expect((await request.post('/')) .status()).toBe(403);
 expect((await request.get('/@fs/etc/passwd')).status()).toBe(403);
 expect((await request.get('/docs/editorial/p1.4/enrichments.json')).status()).toBe(403);
});
test('server exposes no approval controls, public Recipe JSON-LD or remote frontend resources',async({page})=>{
 await page.goto('/enrichments/RP-0079/');
 await expect(page.locator('form, input[type="password"], button')).toHaveCount(0);
 await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
 expect(await page.locator('script[src],link[rel="stylesheet"]').evaluateAll(elements=>elements.every(e=>!/^https?:/.test(e.getAttribute('src')??e.getAttribute('href')??'')))).toBe(true);
});
