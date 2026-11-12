# P1.4 — Consolidamento delle prime dieci schede

Base: merge PR #4 `2a85624b03d84e7b462f381d7e854a09e7e5ecdf`, verificato dopo aggiornamento di main. Branch `feat/p1.4-editorial-consolidation`. Consultazioni effettive P1.4: **12 novembre 2026**, data del client Europe/Rome; distinta dalla data degli articoli o del crawl. Lavorazione assistita, senza prova in cucina o approvazione editoriale indipendente già completata.

## Risultati effettivi

| Misura | Totale | Significato |
| --- | ---: | --- |
| Schede riesaminate | 10 | Tutta la selezione P1.3 |
| Consolidate come draft o proposta revisionabile | 6 | Tre draft isolati e tre proposte, non sei approvazioni finali |
| Nuovi draft P1.4 | 1 | RP-0011 gattò |
| Draft P1.3 mantenuti | 2 | Gratin e papas; acqua delle papas resa esplicitamente approssimativa |
| Arricchimenti proposti | 3 | Pitta, gnocchi, bravas, con UUID e slug operativi esistenti |
| Candidate ancora bloccate | 4 | Tiella, RP-0005, tortilla, tartiflette |
| Fonti aggiunte | 8 | Con accessibilità, dipendenze e ambito espliciti |
| Fonti P1.3 ricontrollate | 7 | Le altre rimangono riferimenti storici, senza nuova consultazione simulata |
| Record applicati / aggiornamenti / pubblicazioni | 0 | Registro e contenuti Astro invariati |

Il piano globale valuta tre aggiunte perché **anche i due draft P1.3 non sono ancora nel catalogo operativo**. Ciò non significa tre nuovi draft P1.4. La parola “consolidate” descrive l’esistenza di un risultato revisionabile, non lo stato `verified`. I tre arricchimenti sono ancora proposte manuali da approvare, non aggiornamenti eseguiti.

## Decisioni e differenze da P1.3

| Ricerca | Esito P1.4 | Formula / decisione |
| --- | --- | --- |
| RP-0001 Pitta salentina | Proposta candidate | Versione Agrodolce; nuove dosi e ingredienti, porzioni 6; tempi non forzati in scalari |
| RP-0002 Tiella barese | needs_review | Scelta documentale Masserie, porzioni 6; volume totale, geometria e trattamento termico ancora da definire |
| RP-0005 Patate alla salentina | needs_review | Nessun riscontro diretto sufficiente; non identificate con pitta, insalata o polpette |
| RP-0039 Gnocchi | Proposta candidate | Versione Cucchiaio; corrette quantità e mancata inclusione della lessatura nel demo; intervalli conservati |
| RP-0011 Gattò | Nuovo draft | Formula Ruggiero completa, attribuita dalla pagina a GialloZafferano; nessuna attribuzione storica promossa |
| RP-0077 Tortilla | needs_review | Scelta versione Serrano; riposo miscela 10 min documentato, totale e riposo finale non risolti |
| RP-0079 Bravas | Proposta candidate | Versione Joseba fritta con brodo di pollo e paprika, senza passata; nessuna presunta variante regionale |
| RP-0080 Papas | Draft mantenuto | Formula invariata, `quantity.approximate` per circa 2 l d’acqua; mojo già preparato escluso dai tempi della salsa |
| RP-0062 Gratin | Draft mantenuto | Riconfermata sola formula Eurial; record culinario identico a P1.3 |
| RP-0063 Tartiflette | needs_review | Formula CNIPT: 10+15+5+15=45 min cottura; raffreddamento e attesa non quantificati |

### Gattò: riconciliazione senza inventare tempi

La fonte Ruggiero dichiara 30 minuti di preparazione e 70 di cottura. Il procedimento indica lessatura 30–40 e forno 30: il budget 70 coincide con il limite alto dell’intervallo 60–70. Nel record si mantiene il valore dichiarato dall’autore e nel passaggio si conserva **30–40**; non si presenta 70 come misura esatta di ogni esecuzione. Nessun riposo è prescritto in questa versione: `restMinutes: 0` ha questo significato di pianificazione. Teglia 20×20 cm, sei porzioni e quantità della singola fonte sono mantenute anche se differiscono dalle altre versioni. Parmigiano del composto e della superficie rimangono due righe distinte: due cucchiai non sono convertiti arbitrariamente in grammi.

La pagina attribuisce espressamente la formula a GialloZafferano. Le due fonti condividono quindi il gruppo di dipendenza: non sono due conferme indipendenti. Cucchiaio documenta separatamente l’identità del piatto, non le stesse dosi. Gli aneddoti sulle origini restano irrisolti e assenti dal record. Una review dovrà confermare la sufficienza della formula e la sua riproducibilità.

### Tiella: pulizia, apertura e cottura

La selezione di lavoro Masserie ha dosi e porzioni, ma prescrive acqua fino a coprire gli ingredienti più liquido delle cozze senza volume complessivo o teglia dimensionata. Non si prende un valore in ml dalle altre ricette per completarla. Anche il passaggio iniziale sul gas non ha una durata distinta: nessun draft.

Il dossier separa tre livelli di riscontro: pulizia fisica documentata dalla guida Cucchiaio; apertura a crudo e liquido filtrato della formula Masserie; indicazioni sanitarie IZSVe. Pulizia, apertura delle valve e trattamento termico non sono sinonimi. Il consiglio culinario di fermarsi all’apertura non viene adottato come criterio sanitario; il dossier registra il contrasto con IZSVe, che indica ulteriore cottura. La temperatura impostata del forno non dimostra la temperatura raggiunta al cuore. Non viene dichiarato un protocollo validato per le cozze già aperte a crudo. Questo limite mantiene bloccata la conversione, senza modificare silenziosamente la ricetta. Le indicazioni IZSVe sono riportate come riferimento sanitario circoscritto, non come nuova formula culinaria.

### Altri blocchi

Per RP-0005 il risultato negativo non prova l’inesistenza del piatto: si conserva la candidata e si richiede una fonte al compilatore. Puglia.info presenta polpette con ingredienti simili, non la denominazione cercata. Non è stata eseguita una dismissione né una rinomina per far coincidere piatti diversi.

Per la tortilla la formula Serrano è scelta integralmente, con cipolla facoltativa. Riposo e cottura finale non sono completati con valori di altri autori. Per la tartiflette sono state lette due nuove ricette accessibili, CNIPT e Ducros: non si ricostruisce la parte premium Ducasse. La somma della cottura CNIPT è risolta; non si assegna zero al raffreddamento o all’attesa al servizio non quantificati. La formula Ducros ha un riepilogo non comprensivo della lessatura e non viene usata per riempire i campi mancanti.

## Tre piani di arricchimento, senza upsert

`enrichments.json` contiene per ogni candidata UUID e slug operativi, percorso del demo, SHA-256 precondizione, differenze campo per campo e un `proposedRecord` candidate validato. Quest’ultimo è **parte del piano**, non un lotto da applicare. Identità preservate:

| Ricerca | UUID operativo | Slug |
| --- | --- | --- |
| RP-0001 | f727b885-d91c-5ed7-8ff9-66cacc74208d | pitta-di-patate |
| RP-0039 | 6d84129f-ef35-51f5-b5aa-60ed022140fa | gnocchi |
| RP-0079 | 449f2fe8-e698-5a54-9ea7-8a29984f5de8 | patatas-bravas |

Gli UUID tecnici P1.2 rimangono nei dossier per tracciabilità e non sostituiscono questi UUID operativi. Si propone la stessa ricetta/famiglia: differenze di ripieno o tecnica non dimostrano una variante regionale distinta. L’associazione definitiva richiede approvazione; non viene applicato l’identificatore esterno al demo.

L’importatore P1.1 continua a rifiutare dati differenti sotto un UUID esistente. Nessun upsert, nuovo writer, comando `apply` o modifica dello staging. Dopo review e autorizzazione, un intervento Git separato dovrà ricontrollare la precondizione SHA, rivedere i tempi e aggiornare manualmente la scheda. Il piano P1.4 è revisionabile senza effettuare questa operazione.

## Artefatti e fonti

- `baseline.json`: SHA-256 di tutti i file P1.3, lotto P1.2, contenuti e registro al merge richiesto. Nessun artefatto storico sovrascritto.
- `dossiers/`: dieci dossier P1.4, con riferimento al dossier storico, formula scelta, fonti/affermazioni, decisione, identità, differenze e domande aperte.
- `sources.json`: 24 fonti ereditate più 8 nuove. `consultedInP14` distingue quelle riaperte; autore/ente, data e accessibilità sono espliciti. `derivedFrom` documenta la dipendenza Ruggiero→GialloZafferano.
- `source-matrix.md`: matrice riproducibile delle affermazioni supportate, discordanti, inferite e irrisolte. I riferimenti P1.3 non ricontrollati sono storici, non nuove verifiche.
- `records.json`: tre record P1.1 draft esterni ad Astro, uno nuovo e due mantenuti. Soltanto le fonti sostengono le correzioni culinarie.
- `enrichments.json`: tre proposte manuali, separate dall’envelope dei draft.
- `search-log.json`: ricerca sulla denominazione non confermata e URL non recuperabili esclusi dalle evidenze; nessuna consultazione simulata degli snippet.
- `report.json`: conteggi, identità, fingerprint, limiti e piano globale soltanto validato.

Le otto fonti aggiunte sono Ruggiero (gattò), Serrano/Bonviveur (tortilla), CNIPT e Ducros (tartiflette), Puglia.info (contesto), Cucchiaio (pulizia delle cozze), opuscolo IZSVe e pagina IZSVe delle linee guida. Le sette ricontrollate sono le formule di pitta, gnocchi, bravas, papas, gratin e le due ricette di tiella. Gli URL non recuperabili, anche se presenti negli indici del motore, non sono usati come evidenza operativa.

## Quantità approssimative e compatibilità

Il modello v1 ammette ora `quantity.approximate`, booleano facoltativo **solo per quantità numeriche**. Assente o false mantiene il comportamento precedente. Esempio:

```json
{"value": 2, "unit": "l", "approximate": true}
```

Il formatter condiviso produce **circa 2 l**, sia per gli ingredienti della vista sia per le stringhe Recipe JSON-LD che usano quella vista. Il JSON/CSV conserva il metadato nel campo `ingredients`; nessuna nuova colonna. L’estensione è compatibile con i documenti P1.1/P1.3 esistenti, che non ricevono default aggiuntivi. Un vecchio lettore strict precedente a P1.4 dovrà essere aggiornato per leggere il nuovo metadato. Le quantità `qb` non accettano un falso numero di precisione.

La baseline P1.3 delle papas rimane storica; la nuova edizione P1.4 corregge la rappresentazione dell’acqua senza cambiare 2 litri in una dose esatta. Il mojo è sempre **già preparato**, senza dose di servizio inventata e senza includere il tempo della salsa nei 35 minuti della formula delle patate.

## Validazione e rigenerazione

```sh
npm ci
npm run editorial:check
npm run editorial:consolidation
npm run catalog:check
npm run check
npm test
```

Dopo una revisione consapevole dei dossier, `npm run editorial:consolidation -- --write` rigenera soltanto report e matrice. Non modifica baseline, ricette, registro, proposte o fonti e non risolve questioni editoriali. I controlli verificano Zod, identità stabili/riservate, date/riferimenti/dipendenze, formula versus record/proposta, differenze e precondizioni dei piani, assenza di promozione, integrità storica e output derivati. Non certificano automaticamente la verità delle affermazioni.

La CI conserva i controlli P1.3 e tutte le quattro configurazioni. I controlli di baseline esatta vengono prima delle fixture temporanee di crescita. Test statici e browser controllano che i tre draft esterni non siano raggiungibili come pagine o risultati del magazine. Nessuna fixture diventa contenuto editoriale.

Review indipendente e prove in cucina restano aperte. WebKit/Safari e Aruba non sono stati verificati; nessun accesso operativo ad Aruba/WordPress, merge, auto-merge, deployment o stato verified/published fa parte di questa consegna. I risultati effettivi sullo SHA finale sono riportati nella PR.

## Verifiche locali effettivamente eseguite

`npm ci` riuscito dal lockfile con zero vulnerabilità riportate; nessuna dipendenza aggiunta. Controlli editoriali P1.3/P1.4, catalogo, type checking (0 errori, 0 warning, 0 hint), build statica e test superati nelle quattro configurazioni: produzione `/`, anteprima `/anteprima/`, produzione `/magazine/` con fixture di crescita, anteprima HTTP `/`. **81 test Node e 12 casi Chromium desktop/mobile per configurazione: 324 e 48 complessivi**. Undici nuove regressioni Node e un nuovo scenario browser eseguito sui due viewport. Fixture rimosse e registro ripristinato. Integrità degli artefatti storici, dei contenuti e del registro e `git diff --check` passati. Esito remoto sullo SHA finale nella PR; questi numeri sono risultati locali, non una dichiarazione anticipata di CI verde. WebKit/Safari, prove in cucina e hosting Aruba non eseguiti.
