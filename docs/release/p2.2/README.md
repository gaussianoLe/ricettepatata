# P2.2 — MVP Public Release Candidate

Base: PR #12 merged, `36bd1f3c7a53f1ff8b40fd28b66c0bf367555ff9`. Branch `feat/p2.2-public-mvp`.

**Prodotto preparato:** homepage, catalogo, ricerca/filtri, due pagine ricetta agli URL finali, breadcrumb, correlate e modalità cucina. Stesso componente `RecipeArticle.astro` P2.1, senza duplicazione. Foto Papas con licenza, formati responsive e attribuzione; Gattò mantiene un placeholder esplicito. Nessun nuovo CMS o backend.

## Tre operazioni distinte

1. `npm run build` / `npm run build:preview`: build pubblici ordinari in dist, sempre senza i draft reali. Policy e loader originali invariati.
2. `npm run release:build`: RC statica in una **copia temporanea esterna 0700**, servita soltanto su localhost:4323, noindex + robots Disallow, banner e manifest `deployable: false`. Produce solo le due ricette selezionate, nessun altro draft/demo. Gli originali non vengono riscritti. Non distribuirla in un’area pubblica Aruba. Ctrl+C rimuove copia, cache e sito temporaneo.
3. `npm run release:build -- --approved`: **attualmente BLOCKED**. Richiede autorizzazione esplicita dell’utente e snapshot P1.1 già `published`, dichiarati manualmente e committati per review; non promuove né importa alcun draft. Produce il pacchetto statico finale per `/`, senza banner RC/noindex. Nessuna funzione FTP o deployment.

URL di prova, mentre il comando RC è attivo:

- http://127.0.0.1:4323/ricette/gatto-di-patate/
- http://127.0.0.1:4323/ricette/papas-arrugadas-con-mojo/

`--base=/anteprima/` e `--base=/magazine/` consentono test RC dei percorsi; la produzione approvata accetta solo `/`. Il dominio finale è `https://ricettepatata.it`.

## Autorizzazione: dati espliciti, nessuna promozione automatica

`release/authorization.json` contiene `approved: false`; `approvedBy`/`approvedAt` sono null e gli hash vuoti. `release/approved-records.json` è un envelope di importazione P1.1 esistente `{formatVersion:1,entries:[]}`. Non è un nuovo modello catalogo: al rilascio contiene l’esatta versione approvata dei medesimi due UUID, una sola entry per UUID nell’input di costruzione.

Dopo un mandato esplicito, una PR deve compilare manualmente i due record P1.1 completi a partire dai sorgenti: soltanto i metadati `editorial` possono cambiare (stato published, revisore distinto, date effettive). UUID, slug, ingredienti, dosi, procedimenti, fonti, relazioni, descrizione e corpo devono essere identici ai draft operativi. La build rifiuta ogni altra differenza. Non esiste un comando che generi metadati di approvazione o trasformi un draft in published.

La medesima PR deve dichiarare chi approva, la data effettiva e gli hash canonici dei due snapshot. Per calcolare **solo gli hash**, senza scrivere/promuovere dati: importare `recordDigest` da `release/selection.mjs` e applicarlo alle entry lette con `parseImport`. `photographicFallbackAccepted` resta false: serve una foto Gattò autorizzata oppure l’accettazione esplicita del placeholder. Le modifiche devono essere committate e revisionate: il comando approved rifiuta uno stato Git sporco o file autorizzazione non versionati.

Il catalogo di lavorazione resta il riferimento dei draft e delle formule, immutato in P2.2; lo snapshot di rilascio è la selezione editoriale P1.1 esplicita. Non si creano nuove identità. Il loader isolato vede una sola versione di ciascun UUID. I build ordinari restano esclusi da questo processo e rifiutano una pubblicazione implicita dei due record attraverso la route ordinaria.

## Cosa è pronto e cosa blocca il go-live

Pronti: pagine e navigazione funzionanti, template P2.1 pubblico, SEO ripulita, immagini Papas ottimizzate, pipeline RC/approved riproducibile, test e inventario degli output. La modalità approved è verificata con fixture **CI TEST ONLY in una copia temporanea**, mai come approvazione dell’utente.

Blocchi reali: approvazione editoriale delle due ricette non ricevuta; foto Gattò con diritti/provenienza adeguati mancante (o fallback da accettare esplicitamente); inventario/backup e piano di cutover del document root Aruba da validare prima del trasferimento. Non sono state svolte prove in cucina, su Safari/WebKit reale o sul server Aruba.

**Criterio di successo:** dopo l’approvazione e il completamento degli asset/decisioni sopra, si può produrre il pacchetto pubblico con il comando già implementato, senza progettare un’altra milestone applicativa. Il trasferimento resta un’operazione separata, manuale e autorizzata, con tutela di WordPress.

[Foto/licenze](photos.md), [architettura e guard storici](isolation.md), [deployment e rollback](deployment.md), [evidenze eseguite](validation-evidence.json), [differenze statiche](output-differences.json).

**Audit toolchain aperto:** [11 high propagate da picomatch, nessuna patch disponibile dichiarata](dependency-audit.md). Non presenti nel runtime statico distribuito; decisione di rischio e patch upstream da verificare prima del go-live. `npm audit` non è verde.
