import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {releaseEntry} from '../../editorial/release.mjs';
import {articlePresentation} from '../../editorial/presentation.mjs';
const slugs=['gatto-di-patate','papas-arrugadas-con-mojo'];
test('UX viewport: article/dossier separation, full ingredients and unchanged metadata',async({page})=>{
 for(const slug of slugs){
  const release=releaseEntry(slug)!,p=articlePresentation(release.entry);await page.goto(`/release/${slug}/`);
  const article=page.locator('[data-recipe-article]');await expect(article.locator('.intro')).toHaveText(p.intro);
  await expect(article).not.toContainText('draft precedente');await expect(article).not.toContainText('Esito dossier P1.8');await expect(article).not.toContainText('Uso richiesto dal procedimento');
  for(const ingredient of p.ingredients){const row=article.locator(`[data-ingredient-id="${ingredient.id}"]`);await expect(row.locator('.ingredient-amount')).toHaveText(ingredient.amount);await expect(row.locator('.ingredient-name')).toHaveText(ingredient.name);await expect(row.getByRole('checkbox')).toHaveAccessibleName(new RegExp(ingredient.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));}
  expect(await article.locator('.steps-list li p').allTextContents()).toEqual(release.entry.data.steps.map(s=>s.text));
  await expect(article.getByRole('heading',{name:'Allergeni',exact:true})).toBeVisible();await expect(article.getByRole('heading',{name:'Conservazione e riscaldamento',exact:true})).toBeVisible();
  const placeholder=await article.locator('.image-placeholder').boundingBox();expect(placeholder!.height).toBeLessThan(250);
  const width=page.viewportSize()!.width,ingredients=await article.locator('.ingredient-panel').boundingBox(),steps=await article.locator('.steps-panel').boundingBox();
  if(width<960)expect(steps!.y).toBeGreaterThan(ingredients!.y+ingredients!.height-1);else expect(Math.abs(steps!.y-ingredients!.y)).toBeLessThan(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const target of await article.locator('.recipe-jumps a,.recipe-jumps button,.ingredient-list label').all()){const box=await target.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
  const normal=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(normal.violations.map(v=>v.id)).toEqual([]);
  await page.getByText('Questioni aperte e asset mancanti',{exact:true}).click();await expect(page.getByRole('heading',{name:'Dossier di revisione',exact:true})).toBeVisible();
  await expect(page.locator('.review-dossier pre')).toHaveText(release.entry.body);
  for(const ingredient of release.entry.data.ingredients)if(ingredient.preparation)await expect(page.locator('.review-dossier')).toContainText(ingredient.preparation);
  const expanded=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(expanded.violations.map(v=>v.id)).toEqual([]);
  const schemas=await page.locator('script[type="application/ld+json"]').allTextContents();expect(schemas.map(s=>JSON.parse(s))).toEqual([release.seo.schema,release.seo.breadcrumb]);
 }
});
test('UX viewport: keyboard/touch cooking mode preserves readable content without persistence',async({page})=>{
 for(const slug of slugs){
  await page.goto(`/release/${slug}/`);const toggle=page.getByRole('button',{name:'Modalità cucina',exact:true});await toggle.focus();await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-pressed','true');
  const checkbox=page.locator('[data-ingredient-check]').first();await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();await page.getByRole('link',{name:'Procedimento',exact:true}).click();await expect(page.locator('#procedimento')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const cooked=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(cooked.violations.map(v=>v.id)).toEqual([]);
  await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','false');await page.reload();await expect(checkbox).not.toBeChecked();
  expect(await page.evaluate(()=>Object.keys(localStorage).length)).toBe(0);
 }
});
