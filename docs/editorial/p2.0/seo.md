# Preparazione SEO e matrice dei dati strutturati

Il builder `recipeSEO` è privo di dati incorporati e riusabile. Nell’app locale emette metadati per simulare la futura pagina, con `noindex,nofollow,noarchive`, HTTP X-Robots-Tag e protezione localhost. Non autorizza l’indicizzazione. Canonical finale `https://ricettepatata.it/ricette/{slug}/`, mai l’URL `/release/` o un host locale. Il parametro base esplicito è validato e testato anche per `/anteprima/` e `/magazine/`; l’app privata usa `/` e non eredita variabili pubbliche.

| Proprietà | Gattò | Papas | Evidenza / limite |
| --- | --- | --- | --- |
| title/meta description/OG | nome e descrizione operativi | nome e descrizione operativi | Nessun nuovo claim; title con marchio |
| canonical/og:url | URL operativo stabile | URL operativo stabile | Dominio definitivo HTTPS; nessuna route pubblicata |
| og:type/locale/site_name | article / it_IT / RicettePatata.it | uguale | Fallback testuale, nessuna immagine |
| Recipe.name/alternateName | nomi esistenti | nome italiano/originale | Nessun nome inventato |
| author | autore editoriale operativo | autore editoriale operativo | Non attribuisce a noi le formule; citation distingue fonti |
| recipeCuisine/category | tradizioni e portate operative | tradizioni e portate operative | Nessuna conversione politica/geografica automatica |
| recipeYield | 6 porzioni | 4 porzioni | Resa della fonte, non verificata in cucina |
| prepTime/cookTime | PT30M / PT70M | PT5M / PT30M | Durate della formula, limiti visibili nel testo |
| totalTime | omesso | omesso | Nessun totale garantito o tempo mojo incluso |
| recipeIngredient | quantità P1.1 esatte | quantità P1.1 esatte | q.b., circa, preparazioni e obbligatorietà preservate |
| recipeInstructions | quattro HowToStep ordinati | quattro HowToStep ordinati | Testo originale operativo invariato |
| citation | URL fonti operative | URL fonti operative | Date/attribuzioni visibili nell’articolo, non aggiornate senza consultazione |
| BreadcrumbList | Home → Ricette → nome | uguale | URL finali; link UI restano nell’app locale |
| image/rating/review/nutrition | omessi | omessi | Dati assenti o non verificati |
| datePublished | omesso | omesso | Nessuna pubblicazione; il builder usa solo una data già esplicita se presente in un futuro record autorizzato |

I JSON-LD sono emessi **solo nelle nuove route locali**; il test browser confronta oggetti e metadati con il record. Nessun totale inventato quando timing è null; porzioni/cucina assenti vengono omesse. Non sono state eseguite richieste a Google Rich Results Test né dichiarata idoneità: manca l’immagine richiesta dai rich result Recipe. Prima di un rilascio effettivo ricontrollare le linee guida aggiornate del motore e la decisione editoriale.

Riferimento tecnico effettivamente consultato il 2026-11-16: [Google Search Central — Recipe structured data](https://developers.google.com/search/docs/appearance/structured-data/recipe), proprietà richieste `image` e `name`. La documentazione tecnica non è una nuova fonte gastronomica.
