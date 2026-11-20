import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
const photos=JSON.parse(readFileSync('release/photos.json','utf8'));
async function checkCardCredits(page:import('@playwright/test').Page){
 const gatto=page.locator('[data-recipe]').filter({has:page.getByRole('heading',{name:/Gattò/})}).locator('.card-photo-credit');
 await expect(gatto).toContainText('generata con intelligenza artificiale');
 await expect(gatto).not.toContainText('Foto:');await expect(gatto.locator('a')).toHaveCount(0);
 const papas=page.locator('[data-recipe]').filter({has:page.getByRole('heading',{name:/Papas/})}).locator('.card-photo-credit');
 await expect(papas).toContainText('Papasarrugadas.jpg');await expect(papas).toContainText('Fer..');
 await expect(papas.locator('a')).toHaveCount(2);
 await expect(papas.locator('a').first()).toHaveAttribute('href',photos['papas-arrugadas-con-mojo'].sourcePage);
}

test('home to catalog, search/filters, both final recipe URLs and related navigation',async({page,isMobile})=>{
 await page.goto('./');await expect(page.locator('[data-recipe]')).toHaveCount(2);await checkCardCredits(page);
 if(isMobile)await page.getByRole('button',{name:'Menu',exact:false}).click();
 await page.getByRole('navigation',{name:'Navigazione principale'}).getByRole('link',{name:'Ricette',exact:true}).click();
 await checkCardCredits(page);
 const query=page.getByRole('searchbox',{name:'Cerca ricette'});await query.fill('mojo');await expect(page.locator('[data-recipe]:visible')).toHaveCount(1);await page.getByRole('button',{name:'Italia',exact:true}).click();await expect(page.locator('[data-empty]')).toBeVisible();await page.getByRole('button',{name:'Azzera filtri'}).click();
 await page.locator('[data-recipe] a[href$="/ricette/gatto-di-patate/"]').click();await expect(page.locator('[data-recipe-article]')).toBeVisible();await expect(page.getByRole('heading',{level:1})).toHaveText('Gattò di patate');
 await page.getByRole('navigation',{name:'Altre ricette'}).getByRole('link',{name:/Papas/}).click();await expect(page).toHaveURL(/papas-arrugadas-con-mojo\/$/);
 await expect(page.getByRole('img',{name:photos['papas-arrugadas-con-mojo'].alt})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('SEO, sources, photo rights, no editorial dossiers and no unauthorized URL',async({page,request,baseURL})=>{
 for(const slug of ['gatto-di-patate','papas-arrugadas-con-mojo']){
  await page.goto(`./ricette/${slug}/`);const html=await page.content();expect(html).not.toContain('Dossier di revisione');expect(html).not.toContain('draft precedente');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new URL(`ricette/${slug}/`,`https://ricettepatata.it${new URL(baseURL!).pathname}`).href);
  const schemas=(await page.locator('script[type="application/ld+json"]').allTextContents()).map(s=>JSON.parse(s));const recipe=schemas.find(s=>s['@type']==='Recipe');expect(recipe.author.name).toBe('RicettePatata.it');expect(recipe.datePublished).toBeUndefined();expect(recipe.recipeInstructions).toHaveLength(4);expect(recipe.totalTime).toBeUndefined();expect(schemas.some(s=>s['@type']==='BreadcrumbList')).toBe(true);
  expect(JSON.stringify(schemas)).not.toContain('assistita');
  expect(html).not.toContain('Torna al catalogo locale');if(slug==='gatto-di-patate'){
   expect(photos[slug].status).toBe('generated');expect(photos[slug].origin).toBe('openai-image-generation');
   await expect(page.getByText('Fotografia non disponibile.',{exact:true})).toHaveCount(0);
   const image=page.locator('.release-photo img');await expect(image).toHaveAttribute('alt',photos[slug].alt);
   expect(await image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
   expect(recipe.image[0]).toContain('/media/gatto-di-patate-social.jpg');
   const caption=page.locator('.release-photo figcaption');
   await expect(caption).toContainText('generata con intelligenza artificiale');
   await expect(caption).toContainText('non documenta una preparazione reale');
   await expect(caption).not.toContainText('Foto:');
   await expect(caption.locator('a')).toHaveCount(0);
  }
  if(slug.includes('papas')){await expect(page.locator('.release-photo figcaption a')).toHaveCount(2);await expect(page.locator('.release-photo figcaption')).toContainText('Papasarrugadas.jpg');await expect(page.locator('.release-photo figcaption')).toContainText('Fer..');await expect(page.locator('.release-photo figcaption a').first()).toHaveAttribute('href',photos[slug].sourcePage);await expect(page.locator('a[href="https://creativecommons.org/licenses/by/2.0/"]')).toBeVisible();expect(recipe.image[0]).toContain('/media/');const img=page.locator('.release-photo img');await expect(img).toHaveAttribute('fetchpriority','high');expect(await img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);}
 }
 for(const url of ['ricette/gratin-dauphinois/','ricette/patatas-bravas/','release/gatto-di-patate/','editorial/','release/authorization.json'])expect((await request.get(baseURL+url)).status()).toBe(404);
 expect(await (await request.get(baseURL+'robots.txt')).text()).toContain('Disallow: /');
});
test('cooking mode, keyboard and automated accessibility in the public shell',async({page})=>{
 for(const slug of ['gatto-di-patate','papas-arrugadas-con-mojo']){
  await page.goto(`./ricette/${slug}/`);const toggle=page.getByRole('button',{name:'Modalità cucina',exact:true});await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-pressed','true');const check=page.locator('[data-ingredient-check]').first();await check.focus();await page.keyboard.press('Space');await expect(check).toBeChecked();
  for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:960});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('usable with JavaScript disabled',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});try{const page=await context.newPage();await page.goto(baseURL+'ricette/gatto-di-patate/');await expect(page.locator('.ingredient-list li')).toHaveCount(12);await expect(page.locator('.steps-list li')).toHaveCount(4);await expect(page.getByRole('button',{name:'Modalità cucina'})).toBeHidden();}finally{await context.close();}
});
