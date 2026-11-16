import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {releaseEntry} from '../../editorial/release.mjs';
const slugs=['gatto-di-patate','papas-arrugadas-con-mojo'];
test('magazine drafts render reviewed content, truthful SEO and missing photography locally',async({page,request})=>{
 for(const slug of slugs){
  const release=releaseEntry(slug)!;const {data}=release.entry;
  await page.goto(`/release/${slug}/`);
  await expect(page.getByRole('heading',{level:1})).toHaveText(data.names.italian);
  await expect(page.getByText('Bozza non pubblicata · draft · ricetta reale, non demo',{exact:true})).toBeVisible();
  await expect(page.getByText('Solo localhost.',{exact:false})).toContainText('Nessuna prova in cucina');
  await expect(page.locator('.ingredient-list li')).toHaveCount(data.ingredients.length);
  expect(await page.locator('.steps-list li p').allTextContents()).toEqual(data.steps.map(s=>s.text));
  await expect(page.getByRole('heading',{name:'Allergeni',exact:true})).toBeVisible();
  await expect(page.getByText('Fotografia non disponibile.',{exact:false})).toBeVisible();
  await expect(page.locator('img,meta[property="og:image"],form')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',release.seo.canonical);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,nofollow,noarchive');
  for(const [property,value] of [['og:title',release.seo.title],['og:description',release.seo.description],['og:url',release.seo.canonical]])await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute('content',value);
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map(s=>JSON.parse(s))).toEqual([release.seo.schema,release.seo.breadcrumb]);
  await page.getByText('Questioni aperte e asset mancanti',{exact:true}).click();
  for(const issue of release.openIssues)await expect(page.getByText(issue,{exact:true})).toBeVisible();
  await expect(page.getByRole('button')).toHaveCount(1);
  expect((await request.get(`/release/${slug}/`)).headers()['cache-control']).toBe('no-store');
 }
 expect((await request.get('/release/gratin-dauphinois/')).status()).toBe(404);
});
test('release mobile/tablet/desktop accessibility, keyboard and cooking consultation',async({page})=>{
 for(const slug of slugs){
  await page.goto(`/release/${slug}/`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Salta al contenuto'})).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#contenuto')).toBeFocused();
  const toggle=page.getByRole('button',{name:'Modalità cucina',exact:true});
  await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-cooking-help]')).toBeVisible();
  const checkbox=page.locator('[data-ingredient-check]').first();await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('link',{name:'Procedimento',exact:true}).click();await expect(page).toHaveURL(/#procedimento$/);
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,impact:v.impact}))).toEqual([]);
  await page.reload();await expect(checkbox).not.toBeChecked();await expect(toggle).toHaveAttribute('aria-pressed','false');
  await page.getByText('Questioni aperte e asset mancanti',{exact:true}).click();
  const expanded=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(expanded.violations.map(v=>({id:v.id,impact:v.impact}))).toEqual([]);
 }
});
test('prepared recipe remains usable without JS and navigation stays in the private app',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:740}});
 try{
  const page=await context.newPage();await page.goto(`${baseURL}/release/gatto-di-patate/`);
  await expect(page.getByRole('button',{name:'Modalità cucina'})).toBeHidden();
  await expect(page.locator('.steps-list li')).toHaveCount(releaseEntry('gatto-di-patate')!.entry.data.steps.length);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('navigation',{name:'Altre ricette'}).getByRole('link',{name:/Papas arrugadas/}).click();
  await expect(page).toHaveURL(/\/release\/papas-arrugadas-con-mojo\/$/);
  await page.getByRole('link',{name:'← Torna al catalogo locale',exact:true}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Revisione editoriale');
 }finally{await context.close();}
});
