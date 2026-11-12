# P1.5 — Integrazione controllata di tre draft

Base main aggiornata e merge PR #5 verificato: `d9e11bf7a8bc20b03f68fa6ec42466c44bac8dae`. Branch `feat/p1.5-controlled-catalog-integration`. Questa integrazione applica soltanto i tre draft P1.4 tramite il contratto P1.1; nessuna nuova ricerca o promozione editoriale.

## Risultato e identità

| Ricerca | Ricetta | UUID preservato | File operativo |
| --- | --- | --- | --- |
| RP-0011 | Gattò di patate | 3f5f6cf2-d990-5bcb-92e5-9c388233acbb | src/content/ricette/gatto-di-patate.md |
| RP-0062 | Gratin dauphinois | 1dbbf517-99d2-5c16-9ef3-a83064238ffb | src/content/ricette/gratin-dauphinois.md |
| RP-0080 | Papas arrugadas con mojo | 8bb84554-1db7-58df-a43a-c5bea8155ff0 | src/content/ricette/papas-arrugadas-con-mojo.md |

Tre nuovi record operativi, tutti **draft** e `demo: false`. Zero nuove pubblicazioni, aggiornamenti dei demo, arricchimenti applicati o collisioni. Ogni campo del record e del corpo Markdown coincide con l’envelope P1.4. UUID, slug, identificatori di ricerca, fonti con date di consultazione originarie, ingredienti, formule, note, procedimenti e precisione delle quantità non sono stati riscritti. Il registro aggiunge soltanto le tre nuove coppie UUID/slug, preservando tutte le riserve preesistenti.

Formule di riferimento: Ruggiero per il gattò, Eurial per il gratin, Bonviveur/Sofía de la Torre per le papas. Restano i limiti editoriali documentati in P1.4, inclusi il budget di cottura del gattò e la salsa mojo già preparata fuori dai tempi. L’acqua delle papas conserva `approximate: true`. Nessun dato mancante è stato inventato. Anche i corpi sono copiati letteralmente: contengono annotazioni storiche che descrivevano i draft come esterni ad Astro. Ora sono annotazioni di provenienza, non una descrizione aggiornata della collocazione del file; non sono esposte pubblicamente.

## Piano prima dell’integrazione

Il piano `plan.json` è stato prodotto con `parseImport()` e `planImport()` sul catalogo preintegrazione. Verificava esattamente tre aggiunte senza collisioni, il digest dell’envelope P1.4 e del registro precedente. `stageImport()` ha preparato i tre Markdown e il registro proposto in una directory **nuova ed esterna al checkout**, denominata `ricettepatata-p15-reviewed-stage`. Le impronte dei file di staging sono nel piano.

L’applicazione nel branch ha copiato esclusivamente i tre file con creazione esclusiva e verificato la precondizione del registro. L’importatore esistente non è stato modificato e non esiste un upsert o un nuovo modello di ricetta. L’importazione ripetuta salta i tre record identici; modifiche sotto gli stessi UUID rimangono conflitti. Lo staging esterno non è un deployment.

`report.json` confronta i record realmente integrati con fonte, dossier, piano e file di staging; verifica la formula, lo stato e il contenuto byte per byte. Il catalogo operativo deve essere esattamente quello precedente più questi tre record. Qualsiasi ulteriore aggiunta, ritiro, cambio di identità, promozione o modifica di un demo fallisce il controllo.

## Visibilità nei due target pubblici

La precedente anteprima includeva ogni draft. Da P1.5 **i draft editoriali non dimostrativi sono esclusi sia da produzione sia dall’anteprima pubblica**, indipendentemente dal base path. I demo preesistenti mantengono la loro precedente anteprima per rispettare il requisito di non regressione. Questa eccezione dimostrativa non è assegnata ai nuovi record e non li rende pubblici. Nessun nuovo stato o campo di visibilità è stato aggiunto al modello P1.1.

La stessa policy opera a due livelli:

1. Il loader applica `publicStore()` ai dati validati prima della persistenza: elimina eventuali draft presenti in una cache precedente e rifiuta nuove scritture non eleggibili, anche durante gli aggiornamenti del loader.
2. `visibleCollection()` mantiene il filtro usato dalle pagine, dagli indici e dai link. Il catalogo sorgente completo continua a essere validato, inclusi i record privati; il filtro non nasconde errori di schema o collisioni.

I tre draft non generano pagine HTML, risultati di ricerca, liste/filtri, sitemap o Recipe JSON-LD. Gli URL diretti restituiscono 404. Non esistono attualmente feed dedicati; eventuali feed o indici dentro `dist` sono comunque compresi nell’audit dei file.

L’audit `integration:output` legge **tutti** i file distribuiti, senza limitarsi a HTML: JavaScript, JSON, mappe sorgente, CSS, testo e altri asset. Cerca UUID, slug, titoli, descrizioni, corpi, URL delle fonti e passaggi, anche nelle normali forme serializzate JSON/HTML e con escape Unicode. Ispeziona inoltre file gzip/Brotli decodificati, rifiuta symlink e archivi zip/tar/7z non ispezionabili. I test iniettano fughe in JS, mappe, JSON, gzip e Brotli per verificare che vengano rilevate.

La superficie di distribuzione è **solo `dist/`**. Repository, `src/content`, dossier e cache locale `.astro` contengono dati di lavorazione e non devono essere caricati sull’hosting. Questo non autorizza alcun upload o deployment. Un test aggiuntivo controlla che i tre UUID non siano presenti neppure nei file del content store generato durante la build verificata.

## Tre arricchimenti: solo preparazione

`enrichment-checklists.json` conserva UUID/slug operativi, SHA-256 precondizione, campi proposti e approvazioni individuali tutte pendenti. `report.json` conferma che gli hash dei tre demo sono invariati. Nessun `proposedRecord` di `enrichments.json` è stato importato.

| Ricerca | Identità operativa | Criticità e approvazione individuale |
| --- | --- | --- |
| RP-0001 | f727b885-d91c-5ed7-8ff9-66cacc74208d / pitta-di-patate | timing null; riconciliare preparazione, lessatura, forno e riposo; confermare cambi di ingredienti/dosi e 4→6 porzioni |
| RP-0039 | 6d84129f-ef35-51f5-b5aa-60ed022140fa / gnocchi | timing null; conservare gli intervalli e includere la lessatura; rivedere quantità/farina variabile e confine del condimento |
| RP-0079 | 449f2fe8-e698-5a54-9ea7-8a29984f5de8 / patatas-bravas | cambio da forno a frittura e dalla passata a paprika/brodo; valutare brodo di pollo e qualifiche alimentari; il piano rimane candidate |

Per ciascuna occorre approvare separatamente identità, formula, tempi, review editoriale e un eventuale intervento Git manuale futuro con nuova verifica SHA. Non sono varianti regionali dimostrate soltanto perché cambiano tecnica o ripieno. Nessuna seconda identità è creata per aggirare lo slug bravas. Queste checklist sono documentazione per la futura approvazione, non richieste di applicazione dentro questa PR.

## Baseline storiche e controlli correnti

Nessun file nelle aree P1.3/P1.4 o nel lotto P1.2 è cambiato. `baseline.json` conserva hash di tutti questi file, dei vecchi contenuti e il testo esatto del registro al merge P1.4. `historicalCatalog()` valida prima il catalogo attuale e verifica gli hash storici, poi ricostruisce il catalogo precedente tramite i suoi UUID e il registro originale. Non ignora gli errori del catalogo corrente.

I controlli P1.3/P1.4 e le relative regressioni ora operano esplicitamente su questa proiezione storica; report, dossier, formule e matrici originali restano immutabili. `--write` dei due vecchi comandi viene rifiutato per evitare riscritture della storia. L’integrazione reale e il registro attuale sono verificati separatamente da `integration:check`, senza proiezione o esclusioni. Le fixture di crescita sono confinate ai test e rimosse a fine scenario.

```sh
npm ci
npm run catalog:check
npm run editorial:check
npm run editorial:consolidation
npm run integration:check
npm run check
npm run build
npm run build:reproducible -- production
npm run integration:output
npm test
npm run test:e2e
```

Dopo una build di anteprima usare `npm run build:reproducible -- preview` con gli stessi `BUILD_TARGET`, `BASE_PATH` e `SITE_URL`. La verifica confronta percorsi e SHA-256 di tutti i file fra due build consecutive con gli stessi input, non soltanto il numero di pagine. Cache private e log non sono parte dell’output riproducibile.

`npm run integration:check -- --write` rigenera esclusivamente il report P1.5 dopo verifica dei record; non importa, modifica o pubblica dati. `plan.json` e le checklist non vengono ricreati automaticamente. `visibility-evidence.json` registra gli audit locali realmente eseguiti nelle quattro configurazioni; la CI esegue audit indipendenti sullo SHA finale, con eventuali fixture dichiarate.

Restano review indipendente e prove in cucina. WebKit/Safari e hosting Aruba non verificati. Nessun merge, auto-merge, deployment, intervento Aruba/WordPress o promozione a verified/published eseguito.

## Verifiche locali eseguite

`npm ci` completato. Matrice completa eseguita nelle configurazioni produzione `/`, anteprima `/anteprima/`, produzione `/magazine/` con fixture di crescita e anteprima `/` su HTTP locale. Per ciascuna: controlli catalogo, type checking (0 errori, avvisi e hint), build, seconda build con confronto esatto degli SHA-256, audit statico, **91 test Node superati senza skip** e **12 test browser Chromium desktop/mobile superati**. Totale: 364 esecuzioni Node e 48 browser. Controlli editoriali storici e integrazione P1.5 superati prima delle fixture.

Gli audit locali hanno letto rispettivamente 10, 18, 14 e 18 file, con 47 marker e zero fughe. Il risultato registra esplicitamente zero file compressi presenti: gzip/Brotli sono supportati e verificati tramite iniezioni nei test, non dichiarati presenti nelle build. Le fixture sintetiche di crescita sono state rimosse. Le quattro verifiche di riproducibilità sono passate con gli stessi input; nessun file dell’output è escluso dal confronto.

L’evidenza locale è in `visibility-evidence.json`. L’esito GitHub Actions sul commit finale viene riportato nella PR, separatamente da queste prove locali. L’elenco completo dei file della modifica è in `changes.md`.
