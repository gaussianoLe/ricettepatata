# P1.2 — Preparazione controllata del primo lotto

**Dataset reale non disponibile: nessuna importazione effettiva eseguita.** Questa milestone consegna adattatore, classificazione, report e staging per un lotto di massimo 50 candidate. Non contiene 50 ricette inventate o un dataset di ricerca sostitutivo. I dati sintetici sono confinati ai test.

Base: ultimo `main` al commit `b0c0368`, comprensivo del modello P1.1 e del rework della PR #2. Branch: `feat/p1.2-first-catalog-batch`.

## Stato di attesa e report consegnato

```sh
npm run catalog:batch
```

Senza `--input` il comando produce solo il report di attesa, non legge un dataset e non scrive file. Copia del report: [research/readiness-report.json](research/readiness-report.json).

Il report dichiara `waiting_for_dataset`, `datasetAvailable: false`, `importExecuted: false` e target 50. Ricevuti/accettati/esclusi/da revisionare sono tutti zero: **non** sono l’esito di un’analisi di 50 record. Usare `--stage` senza dataset fallisce, senza creare directory.

## Contratto del dataset di ricerca

L’adattatore non presume di conoscere colonne o struttura del dataset che sarà consegnato. Per JSON sono supportati un array di oggetti con campi piatti oppure `{ "formatVersion": 1, "rows": [...] }`. Per CSV: UTF-8, BOM facoltativo, intestazione univoca, virgola, virgolette RFC 4180, campi multilinea; massimo 5 MB per riga. Non sono supportati delimitatori o annidamenti indovinati automaticamente.

Il formato di ricerca è distinto dall’involucro P1.1 `{formatVersion, entries}`: il pacchetto P1.1 viene prodotto solo dopo adattamento e controlli. Le strutture JSON nelle celle CSV devono essere dichiarate tramite le colonne mappate descritte sotto, senza parsing euristico di ingredienti o prosa.

## Profilo esplicito, da completare alla ricezione

[research/profile.template.json](research/profile.template.json) è un **template intenzionalmente non valido** finché `datasetId`, `editorialAuthor` e `recordDate` sono vuoti. Le etichette di colonna sono soltanto esempi tecnici: confrontarle con le intestazioni reali e modificarle. Non usare valori segnaposto come metadati del catalogo.

| Profilo | Significato |
| --- | --- |
| `formatVersion` | Intero `1` |
| `datasetId` | Namespace stabile, minuscolo con trattini, per questa fonte di ricerca; non cambiarlo tra riesecuzioni |
| `editorialAuthor` | Responsabile dichiarato della preparazione del lotto, distinto dall’autore della fonte |
| `recordDate` | Data ISO della registrazione editoriale; non viene usata come data di consultazione delle fonti |
| `columns` | Dizionario campo adattatore → nome letterale di colonna/proprietà del dataset |

Le mappature obbligatorie sono `sourceId`, `slug`, `italianTitle`, `originalTitle`, `originalLanguage`, `description`, `potatoRole`, `relationKind`. Per una riga senza un dato obbligatorio l’esito è da revisionare: nessun titolo viene tradotto e nessuna descrizione, lingua, classificazione o relazione principale viene inventata per superare lo schema P1.1.

I campi supportati sono:

| Campo adattatore | Regole |
| --- | --- |
| `sourceId` | Stringa stabile della fonte, senza spazi esterni; preserva zeri iniziali. Numeri JSON devono essere corretti esplicitamente nel dataset, non convertiti in modo ambiguo |
| `catalogId`, `slug` | UUID opzionale esplicito e slug URL obbligatorio. Nessuna generazione di slug dai titoli |
| `italianTitle`, `originalTitle`, `originalLanguage` | Valori presenti nel dataset; nessun fallback che simuli una traduzione |
| `alternativeNames` | JSON di `{text, language}` conformi a P1.1 |
| `description`, `body` | Descrizione obbligatoria e corpo Markdown opzionale, copiati senza generazione di prosa |
| `continent`, `countryCode`, `countryName`, `region`, `traditions` | Geografia dichiarata; codice e nome Paese devono essere entrambi presenti o entrambi ignoti; non si deducono nomi/continenti da codici |
| `potatoRole` | `protagonist`/`secondary` esplicito, mai dedotto dal titolo o dal contesto del lotto |
| `courses`, `cookingMethods`, `families`, `occasions` | Array JSON con ID ammessi dalla tassonomia P1.1 |
| `ingredients`, `steps`, `timing`, `servings` | Strutture/numeri JSON P1.1, compresi tempi non nulli e porzioni numeriche quando disponibili; testi liberi non sono trasformati in ingredienti o quantità indovinate |
| `sources` | Array JSON di fonti P1.1 complete e documentate |
| `sourceUrl`, `sourceTitle`, `sourceAuthor`, `sourceAccessedAt`, `sourceKind` | Alternativa per una sola fonte piatta: devono essere tutti presenti; nessuna data/autore/tipologia viene dedotta dal solo URL |
| `notes` | Note culturali/storiche/curiosità con riferimenti a fonti esistenti, conformi a P1.1 |
| `relationKind`, `primaryId`, `primarySourceId` | `primary`/`variant` esplicito. Le varianti referenziano un UUID oppure uno `sourceId` nello stesso namespace, non entrambi. Non si cercano genitori tramite titoli |
| `duplicateOf` | UUID canonico dichiarato dal dataset: il duplicato viene escluso dal lotto, senza fusione automatica |

`alternativeNames`, `traditions`, tassonomie, ingredienti, passaggi, tempi, porzioni, fonti e note sono valori JSON; in CSV vanno quotati secondo RFC 4180. Per gli altri campi si usano stringhe. Celle vuote o null rappresentano dati non forniti. Campi strutturati malformati producono errori di revisione, senza ignorare silenziosamente il contenuto.

Per i dati opzionali ignoti l’adattatore usa soltanto le rappresentazioni previste per candidate da P1.1: array vuoti e valori nulli, annotando le mancanze nel report. Una fonte parziale o una geografia incoerente non viene scartata silenziosamente per creare un record apparentemente valido. `sources` e fonte piatta contemporanei sono un’ambiguità da risolvere.

Metadati tecnici assegnati dall’adattatore: `schemaVersion: 1`, `editorial.status: candidate`, `demo: false`, autore/data di preparazione dichiarati nel profilo, colore di presentazione `gold`, identificatore esterno namespace/sourceId. Non sono fatti culinari o prove di verifica. Le colonne editoriali del dataset non possono promuovere il contenuto a draft, verified o published; i campi non mappati sono segnalati per nome e non copiati nel record.

## Identità e riproducibilità

Se non è fornito un UUID, si riutilizza quello già registrato per namespace/sourceId; per una nuova identità si deriva un UUIDv5 da namespace applicativo fisso e coppia datasetId/sourceId. Titolo, slug, ordine delle righe e data del profilo non cambiano l’identità. In assenza di sourceId stabile la riga resta da revisionare: non si usano numero di riga o nome della ricetta come sostituti.

Il report contiene hash SHA-256 dei byte dell’input e della rappresentazione canonica del profilo e delle righe, più indice della riga e sourceId. L’indice identifica il record logico, non la linea fisica in un CSV multilinea. L’input originale deve essere conservato separatamente: il report non ne contiene una copia integrale. Gli hash attestano corrispondenza dei file, non veridicità delle fonti.

## Classificazione del report

| Esito | Significato |
| --- | --- |
| `accepted` | Nuovo record strutturalmente valido come candidate, senza conflitti irrisolti. Non equivale a ricetta verificata; mancanze opzionali, incluse fonti non fornite, restano esplicite nei warning |
| `excluded` | Riga identica ripetuta, fonte già registrata oppure duplicato canonico dichiarato e risolto. Nessun upsert o fusione |
| `review` | Dati obbligatori mancanti, schema/JSON errato, fonte parziale, ID/slug in collisione, relazioni irrisolte o nomi potenzialmente duplicati/varianti |

Ogni riga compare in uno solo dei tre gruppi, con codici motivazione, campi mancanti, warning e possibili corrispondenze. SourceId ripetuti con righe diverse, UUID condivisi o slug condivisi tra nuove righe mandano tutte le righe coinvolte in revisione: non viene scelta la prima come vincente. Le riserve degli URL ritirati e le identità delle altre raccolte vengono rispettate.

La ricerca di possibili duplicati/varianti confronta titolo italiano, originale e alias dopo normalizzazione Unicode e usa corrispondenze esatte o sovrapposizione di parole significative. È una segnalazione conservativa, senza traduzione o classificazione gastronomica automatica; può avere falsi positivi e falsi negativi. Non trasforma una ricetta in variante in base alla sola regione. I riferimenti principali/varianti espliciti e validi sono rispettati; dipendenze da record esclusi o da revisionare non vengono accettate come nuove principali.

Il limite è 50 record di input: oltre il limite il lotto è bloccato, senza troncamenti. Duplicati o errori non vengono compensati con ricette inventate per raggiungere 50. Dopo correzioni editoriali del dataset/profilo, rieseguire la preparazione e confrontare report e fingerprint; le ambiguità non si risolvono automaticamente.

## Flusso futuro quando il dataset sarà disponibile

I comandi seguenti sono istruzioni per un’operazione futura, **non eseguita su un dataset reale in questa milestone**:

```sh
npm run catalog:batch -- --input /percorso/dataset.csv --profile /percorso/profilo.json
npm run catalog:batch -- --input /percorso/dataset.json --profile /percorso/profilo.json
```

Default: solo report JSON su stdout, nessun file scritto. Codice d’uscita `2` se il lotto è bloccato o richiede revisione; errori di parsing/profilo/file mancante sono errori senza staging. Prima di qualunque staging leggere il report, conservare l’input immutabile e verificare la mappatura con una review indipendente.

Per un lotto completo accettato di 50 candidate, soltanto dopo la disponibilità del dataset e l’autorizzazione al passo concreto:

```sh
npm run catalog:batch -- --input /percorso/dataset.csv --profile /percorso/profilo.json --stage /private/tmp/primo-lotto-proposta
```

Un lotto più piccolo o con righe da revisionare viene rifiutato per default. `--allow-partial` è l’accettazione esplicita di uno staging parziale: esporta comunque **soltanto** gli accettati, mai i record review/excluded. Lotti vuoti, oltre limite o con controlli globali falliti non possono essere forzati con questo flag.

La destinazione è nuova, esterna al checkout anche fisicamente, con genitore già esistente. Si usa lo stesso writer sicuro P1.1, con protezioni symlink, identità delle directory e nessun cleanup distruttivo su errore. Gli artefatti JSON aggiuntivi passano per lo stesso writer e non possono sovrascrivere il registro o usare percorsi arbitrari.

```text
primo-lotto-proposta/
  batch-report.json
  candidates.json
  registry.json
  content/ricette/<slug-accettato>.md
```

`candidates.json` è un involucro P1.1 validato; `registry.json` è il registro proposto completo. Il report mantiene `importExecuted: false`: preparare file esterni non applica l’importazione al sito. Nessun comando di questa milestone copia dati in `src/content`, modifica il registro sorgente o pubblica candidate. La loro applicazione in Git e ogni successiva transizione editoriale saranno operazioni separate, dopo disponibilità dei dati e review.

## Verifiche e limiti della consegna

Test sintetici: assenza dataset e blocco CLI senza input, mapping obbligatorio, CSV/JSON, 50 e 51 righe, stato candidate, dati mancanti, fonti parziali, nomi/alias, collisioni, deduplicazione, relazioni in ordine arbitrario, report, staging parziale e protezioni filesystem. Nessuna ricetta sintetica dei test viene aggiunta al catalogo.

Restano da fare quando il dataset arriverà: ispezione delle colonne reali, completamento/revisione del profilo, analisi delle vere 50 righe, verifica delle fonti e risoluzione di duplicati/varianti; soltanto dopo questi passaggi si produrrà un report reale e un eventuale staging. Le euristiche non sostituiscono una revisione linguistica/editoriale. Il parsing è sincrono, senza scraping o risoluzione di URL, e non è una pipeline illimitata di ingestione.

Gli esiti locali e CI effettivamente eseguiti, lo SHA finale e il link alla PR sono riportati nella descrizione della PR P1.2.

### Risultati locali eseguiti — 11 novembre 2026

`npm ci` riuscito (zero vulnerabilità riportate); catalogo, type checking (0 errori/warning/hint), build e test passati in tutte e quattro le configurazioni: produzione `/`, anteprima `/anteprima/`, produzione personalizzata `/magazine/` con fixture editoriali e anteprima HTTP sotto `/`. Ogni configurazione supera 52 test Node e 10 casi browser: 208 e 40 complessivi.

I 20 test nuovi P1.2 usano esclusivamente fixture sintetiche, incluse le prove con 50/51 righe e lo staging esterno, che viene rimosso dai test al termine. Il comando senza input produce soltanto il report di attesa. `src/content` e `src/catalog/registry.json` risultano invariati rispetto a main dopo la rimozione delle fixture CI. `git diff --check` passato. Non sono state aggiunte dipendenze e non è stato eseguito alcun import reale. SHA e risultati CI remoti sono documentati nella PR sul commit finale.
