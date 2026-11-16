# P1.9 — Risoluzione documentale e preparazione alla decisione finale

Preflight completato **prima di creare il branch**: PR #9 merged, merge `621233dae580cd9e393441be756266192d2bae76`. Main aggiornato e branch `feat/p1.9-editorial-resolution` creato da quel commit. Questa PR non cambia alcun record operativo.

## Esito reale

| Ricetta | Esito | Decisione |
| --- | --- | --- |
| RP-0011 — Gattò | `ready_for_independent_review` | Seconda checklist documentale completata; dosi, resa dichiarata, rivestimento, tempi e sicurezza riesaminati; formula invariata |
| RP-0080 — Papas arrugadas | `ready_for_independent_review` | Seconda checklist su acqua/sale, asciugatura, mojo e allergeni completata; formula invariata |
| RP-0062 — Gratin | `needs_revision` | Eurial resta insufficientemente determinata; proposta Merrett separata per una decisione sulla formula, non applicata |

**Le criticità tecniche del gratin non sono tutte chiuse.** Non si dichiara risolta una combinazione che nessuna fonte verifica. Sono conclusi il confronto delle quattro fonti, il rifiuto del loro assemblaggio e la preparazione di una scelta alternativa verificabile. Le checklist sono completate come seconda lettura documentale, non come approvazioni indipendenti o prove in cucina.

## Quattro formule del gratin

`formula-comparison.json` registra separatamente taglio, recipienti, precottura, forno e rapporti dei liquidi. Eurial non specifica i parametri essenziali mancanti. Le altre tre versioni sono ricette differenti, non estensioni implicite della prima. Nessuna geometria è dedotta da fotografie o riferimenti commerciali non letti. Il confronto mantiene null i dati assenti, invece di inventarli.

La compatibilità tra quantità, spessore del cibo, recipiente e tempi di Eurial richiede ancora una precisazione dell’autore oppure una verifica tecnica futura. Questa PR non esegue né simula tale prova. Il dossier RP-0062 continua a segnalare cinque voci tecniche irrisolte.

## Alternativa separata: proposta Merrett

`alternative.json` contiene **una formula unica**, integralmente documentata per ingredienti e procedimento, presa da Paul Merrett / Good Food. Non combina dosi o tempi delle quattro fonti di confronto. Il record proposto usa il contratto P1.1, è `candidate`, `demo: false` e conserva l’identità tecnica e lo slug dell’operativo soltanto per il confronto. Non viene importato, registrato, scritto in src/content o inserito nelle Content Collections.

La maggiore determinazione della fonte non equivale a una validazione completa: lo spessore indicato riguarda **lo strato di patate**, non l’altezza delle pareti della pirofila. Impronta e altezza del recipiente non sono numeriche. La quantità di patate resta in pezzi grandi, senza conversione inventata in massa. La doratura finale facoltativa non precisa nuovi gradi. Queste lacune rimangono visibili e impediscono una decisione automatica.

Il formaggio è facoltativo nella formula alternativa, mentre non è previsto nell’Eurial operativa: decidere se ometterlo e come denominare la versione prima di una sostituzione. Cambiano dosi, resa, prodotto lattiero e metodo. La provenienza non viene copiata automaticamente nel candidate; i campi restano da deliberare. I tempi dichiarati dalla fonte sono conservati nei parametri, ma timing resta null nel candidate senza trasformare una somma parziale in totale esatto.

Il confronto proposto, inclusi tutti i cambiamenti di dati e corpo, è in `diffs.json`. Non è una patch applicata o un upsert. `plan.json` fissa SHA del record corrente e della proposta; ogni mutazione accidentale o flag di approvazione inventato viene rifiutato.

## Seconda revisione di gattò e papas

I dossier individuali distinguono `documented`, `documented_limit` e le approvazioni ancora pendenti. Le dosi e le rese sono quelle delle fonti, non misurazioni nostre. Per il rivestimento del gattò la quantità non pesata resta un’interpretazione redazionale tracciata P1.8; non viene promossa a numero attestato. I tempi sono budget indicativi, non una misura del tempo reale. Per le papas il sale di cottura non diventa un dato di sale ingerito; l’ambito del mojo resta distinto. Nessuna promessa di assenza di allergeni è ereditata per una salsa/prodotto non specificato.

Non sono emerse evidenze che giustifichino modifiche operative alle formule. Le indicazioni FSA sono cautele generali, non dimostrazione della sicurezza di una specifica preparazione o conservazione. Etichette dei prodotti e contaminazioni restano da verificare nel caso concreto. Non viene dichiarata svolta una review indipendente.

## Tracciabilità e integrità

- `baseline.json`: SHA di contenuti, registro, librerie del catalogo e snapshot P1.2–P1.8 al merge #9.
- `plan.json`: **nessuna scrittura operativa autorizzata**, proposta separata con SHA e applicazione non approvata.
- `dossiers/`: tre seconde revisioni e checklist, questioni concluse e pendenti, SHA prima/dopo uguali.
- `sources.json`, `source-matrix.md`: URL, autori/enti, data effettiva, localizzatori e accessi non riusciti distinti.
- `formula-comparison.json`: quattro formule più alternative vagliate, senza ricombinazione.
- `report.json`, `diffs.json`: output riproducibili dallo stato reale; zero diff operativi, diff della sola proposta.

Il controllo P1.9 valida autonomamente tutto il catalogo corrente e gli hash della baseline. Gli altri controlli P1.2–P1.8 continuano a funzionare senza riscritture o nuove eccezioni. Qualsiasi modifica corrente, anche a un demo o al guard P1.8, fallisce: una futura applicazione richiederà un nuovo mandato e una nuova registrazione verificabile. Non si usa la fotografia storica per mascherare lo stato attuale.

## App editoriale e visibilità

`npm run editorial`, poi http://127.0.0.1:4322/. Le schede mostrano la seconda revisione P1.9 accanto al dossier precedente; il confronto separato è su `/resolution/RP-0062/`. Si vedono operativo invariato, candidate, diff, lacune e conseguenze, senza controlli di applicazione o approvazione.

Produzione e anteprima non acquisiscono nuove pagine o record: tutti i draft reali restano esclusi. Test pubblici verificano anche 404 sul percorso privato della proposta. L’audit nuovo cerca il payload alternativo e i marker della UI in tutti gli asset di dist; i controlli P1.8 sui draft vecchi/correnti restano attivi. Nessun upload di artefatti editoriali in CI; isolamento e cleanup P1.7 invariati.

## Controlli riproducibili

```sh
npm ci
npm run editorial:resolution
npm run editorial:validation
npm run catalog:check
npm run editorial:check
npm run editorial:consolidation
npm run integration:check
npm run editorial:enrichments
npm run check
node scripts/build.mjs production
node scripts/verify-reproducible.mjs production
npm run integration:output
npm run editorial:resolution:output
npm test
npm run test:e2e
npm run test:editorial
```

`editorial:resolution -- --write` rigenera soltanto report/diff P1.9 dopo validazione; non crea fonti, decisioni o autorizzazioni e non modifica contenuti. I comandi che leggono il catalogo completo si eseguono senza fixture sintetiche; i test di crescita tengono esplicitamente separato quell’input temporaneo.

## Limiti e decisioni ancora necessarie

Selezionare/approvare una formula del gratin o ottenere i parametri mancanti da una fonte adeguata, poi review indipendente e eventuale prova tecnica realmente eseguita. La proposta Merrett non chiude da sola tutti i dubbi e non autorizza la sostituzione. Gattò e papas attendono la review finale, non una nuova formula automatica. Nessuna prova in cucina, valutazione sensoriale, verifica di etichette o geometria reale svolta.

Nessun merge, auto-merge, deployment, modifica Aruba/WordPress, promozione a verified/published o applicazione di proposte. WebKit/Safari e Aruba non verificati. Valgono i limiti di sicurezza localhost e cleanup documentati in P1.7.

## Risultati locali effettivi

`npm ci` completato. Matrice finale passata nelle quattro configurazioni CI pubbliche: produzione `/`, preview `/anteprima/`, produzione `/magazine/` con crescita sintetica, preview `/` HTTP locale. Per ciascuna: **122/122 test Node senza skip, 14/14 browser pubblici e 10/10 editoriali**, type checking con 0 errori/avvisi/hint, build, riproducibilità byte per byte, audit degli asset e test di assenza della proposta/UI P1.9, controlli catalogo e dossier P1.3–P1.9. Totale 488 esecuzioni Node e 96 browser Chromium desktop/mobile.

Verificati tutti i 114 hash protetti contro il merge #9: zero modifiche operative e zero riscritture storiche. Fixture sintetiche e sessioni dei test rimosse; output e contenuti identici prima/dopo la revisione locale. La CI sullo SHA finale è riportata separatamente nella PR. Elenco completo dei file in `changes.md`.
