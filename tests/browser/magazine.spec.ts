import {test,expect} from '@playwright/test';
import {contentIds,visibleEntries,catalog} from '../helpers/catalog.mjs';
import {isVisible} from '../../src/catalog/policy.mjs';
import {deployment} from '../../src/lib/config.mjs';
const recipeIds=contentIds('ricette');
const {target}=deployment(process.env.TEST_TARGET || 'production',process.env);

test('homepage, responsive navigation and recipe details',async({page,isMobile})=>{
 await page.goto('./');await expect(page.getByRole('heading',{level:1})).toContainText('Una patata');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 if(target==='preview') await expect(page.locator('.preview-banner')).toBeVisible();
 else await expect(page.locator('.preview-banner')).toHaveCount(0);
 if(isMobile){const menu=page.getByRole('button',{name:'Menu'});await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');await menu.click();}
 await page.getByRole('navigation',{name:'Navigazione principale'}).getByRole('link',{name:'Ricette',exact:true}).click();
 await expect(page).toHaveURL(/\/ricette\/$/);await expect(page.locator('[data-recipe]:visible')).toHaveCount(recipeIds.length);
 if(!recipeIds.includes('rosti')) return;
 await page.locator('[data-recipe] a[href$="/ricette/rosti/"]').click();await expect(page.getByRole('heading',{level:1})).toHaveText('Rösti croccanti');
 await expect(page.getByRole('heading',{name:'Ingredienti',exact:true})).toBeVisible();expect(await page.locator('ol li').count()).toBeGreaterThan(0);
});

test('search, combined filters, empty state, reset and URL restoration',async({page})=>{
 await page.goto('./ricette/');const query=page.getByRole('searchbox',{name:'Cerca ricette'});
 const catalog=await page.locator('[data-recipe]').evaluateAll(elements=>elements.map(element=>({search:element.getAttribute('data-search')??'',region:element.getAttribute('data-region')})));
 const rostiCount=catalog.filter(recipe=>/r[oö]sti/i.test(recipe.search)).length;
 await query.fill('ROSTI');await expect(page.locator('[data-recipe]:visible')).toHaveCount(rostiCount);
 const italianRosti=catalog.filter(recipe=>/r[oö]sti/i.test(recipe.search) && recipe.region==='Italia').length;
 await page.getByRole('button',{name:'Italia',exact:true}).click();await expect(page.locator('[data-recipe]:visible')).toHaveCount(italianRosti);
 await expect(page.locator('[data-empty]')).toBeVisible({visible:italianRosti===0});
 await page.getByRole('button',{name:'Azzera filtri'}).click();await expect(query).toBeFocused();await expect(page.locator('[data-recipe]:visible')).toHaveCount(recipeIds.length);
 const butterCount=catalog.filter(recipe=>/burro/i.test(recipe.search) && recipe.region==='Europa').length;
 await query.fill('burro');await page.getByRole('button',{name:'Europa',exact:true}).click();await expect(page.locator('[data-recipe]:visible')).toHaveCount(butterCount);
 await page.reload();await expect(query).toHaveValue('burro');await expect(page.getByRole('button',{name:'Europa',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-recipe]:visible')).toHaveCount(butterCount);
 await query.fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Cerca',exact:true}).click();await expect(page.locator('[data-empty]')).toBeVisible();await expect(page.locator('[data-recipe]:visible')).toHaveCount(0);
 await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('world links, editorial routes and keyboard access',async({page})=>{
 await page.goto('./');const worldCount=await page.locator('[data-recipe][data-region="Mondo"]').count();
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Salta al contenuto'})).toBeFocused();
 await page.getByRole('link',{name:/Un biglietto per nuovi sapori/}).click();await expect(page.locator('[data-recipe]:visible')).toHaveCount(worldCount);await expect(page.getByRole('button',{name:'Resto del mondo'})).toHaveAttribute('aria-pressed','true');
 for(const collection of ['curiosita','guide']) {
  await page.goto(`./${collection}/`);
  const entry=visibleEntries(collection)[0];
  if(entry){await page.locator(`a[href$="/${collection}/${entry.data.slug}/"]`).click();await expect(page.getByRole('heading',{level:1})).toHaveText(entry.data.names.italian);}
 }
});

test('static content remains usable without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(baseURL!+'ricette/');await expect(page.locator('[data-recipe]')).toHaveCount(recipeIds.length);if(recipeIds.includes('gnocchi')){await page.locator('[data-recipe] a[href$="/ricette/gnocchi/"]').click();await expect(page.getByRole('heading',{level:1})).toHaveText('Gnocchi di patate');}await context.close();
});


test('direct links cannot expose entries excluded by the editorial policy',async({request,baseURL})=>{
 for(const entry of catalog.filter(entry=>!isVisible(entry.data,target))) {
  const response=await request.get(`${baseURL}${entry.collection}/${entry.data.slug}/`);
  expect(response.status()).toBe(404);
 }
});

test('integrated editorial drafts stay private in lists, search and direct URLs',async({page,request,baseURL})=>{
 const {readFileSync}=await import('node:fs');
 const {entries}=JSON.parse(readFileSync('docs/editorial/p1.4/records.json','utf8'));
 await page.goto('./ricette/');
 const html=await page.content();
 for(const entry of entries){
  expect(html).not.toContain(entry.data.catalogId);
  expect(html).not.toContain(entry.data.description);
  await page.getByRole('searchbox',{name:'Cerca ricette'}).fill(entry.data.names.italian);
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(0);
  const response=await request.get(`${baseURL}ricette/${entry.data.slug}/`);
  expect(response.status()).toBe(404);
 }
});


test('P1.6 blocked enrichments leave each preview demo unchanged and private in production',async({page,request,baseURL})=>{
 const {readFileSync}=await import('node:fs');
 const {plans}=JSON.parse(readFileSync('docs/editorial/p1.4/enrichments.json','utf8'));
 for(const plan of plans){
  const current=catalog.find(e=>e.data.catalogId===plan.catalogId)!;
  const response=await request.get(`${baseURL}ricette/${plan.slug}/`);
  expect(response.status()).toBe(target==='preview'?200:404);
  if(target==='preview'){
   await page.goto(`./ricette/${plan.slug}/`);
   await expect(page.getByRole('heading',{level:1})).toHaveText(current.data.names.italian);
   const html=await page.content();
   for(const source of plan.proposedRecord.sources)expect(html).not.toContain(source.url);
   await expect(page.locator('ol')).toContainText(current.data.steps[0].text);
  }
 }
});
