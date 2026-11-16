# P1.8 — Validazione documentale di tre draft

Preflight: merge PR #8 `eb20683ad773882c88b06457c47642a42ea0d456` verificato, main aggiornato e branch `feat/p1.8-first-recipes-validation` creato. Questa revisione è documentale e assistita; non costituisce una prova in cucina o un’approvazione indipendente.

## Esiti individuali

| Ricetta | Esito dossier | Motivo |
| --- | --- | --- |
| RP-0011 — Gattò di patate | `ready_for_independent_review` | Formula e pirofila ricontrollate; procedimento espanso, pane per il rivestimento distinto senza inventare grammi; budget dei tempi esplicitato |
| RP-0062 — Gratin dauphinois | `needs_revision` | Formula fedele a Eurial, ma taglio, geometria e modalità di cottura non risolti per la sua breve finitura; non ricombinate versioni diverse |
| RP-0080 — Papas arrugadas con mojo | `ready_for_independent_review` | Metodo e confine della salsa chiariti; acqua approssimativa, scolatura prima dell’asciugatura e geografia distinta dall’appartenenza politica |

Sono esiti dei dossier, **non stati editoriali del catalogo**. Tutti e tre i record rimangono `draft`, `demo: false`, con gli stessi UUID, slug, URL e relazioni. Nessun verified/published o reviewer indipendente assegnato. Le due schede pronte hanno zero criticità essenziali aperte; restano da sottoporre a review e non sono dichiarate provate in cucina. Il gratin non è dichiarato pronto.

## Modifiche effettive

I tre file operativi sono gli stessi integrati in P1.5. Dosi numeriche, porzioni, metadati temporali, provenienza e tassonomia sono preservati. I procedimenti sono riscritti e articolati con testi originali; le quantità formattate e il procedimento numerato sono visibili nell’app locale. I corpi non descrivono più i file come esterni ad Astro: ora contengono introduzione, attrezzatura, limiti temporali, allergeni, varianti, conservazione e questioni aperte. Una nota culturale con fonte accompagna ciascun record.

Per il gattò è aggiunto solo il pangrattato q.b. del rivestimento, richiesto dal procedimento della fonte ma non pesato separatamente: i 20 g originali restano assegnati alla superficie. Non si inventa un peso o si ridistribuisce silenziosamente la dose. Non si cambia la resa dichiarata dalla fonte né si importano le dosi differenti delle versioni di confronto.

Le dieci fonti preesistenti restano presenti con stesso ID/URL/autore/tipo e consultazione aggiornata al 13 novembre 2026. Si aggiungono le indicazioni generali FSA, la fonte sulle categorie di allergeni e, nel gratin, Atelier solo come confronto. Le annotazioni allergeniche distinguono ingredienti certi, composti da controllare e salsa non definita: nessuna dichiarazione infondata di assenza. Le indicazioni sugli avanzi sono generali, non prove di durata o garanzie per un mojo non specificato.

## Gratin: problema ancora essenziale

Eurial specifica fette sottili, precottura e finitura senza misure del taglio/recipiente o modalità del forno. Sono state consultate anche le versioni Alpes Isère, Laruelle e Atelier: hanno geometrie o tempi differenti e non dimostrano la medesima combinazione Eurial. Non sono stati trasferiti numeri fra le versioni per far apparire completa la scheda. Occorre una precisazione della formula o una prova tecnica mirata, seguita da review indipendente. Nessuna durata aggiuntiva è inventata.

## Tracciabilità e baseline

- `baseline.json` registra gli hash del catalogo e degli artefatti P1.2–P1.7 al merge richiesto.
- `before/` conserva i tre file precedenti byte per byte; gli hash devono corrispondere alla baseline originale.
- `amendments.json` consente esattamente tre revisioni manuali con SHA prima/dopo, campi modificati e dossier di supporto. Non è un importatore o un upsert.
- `diffs.json` confronta ogni valore e il corpo; `report.json` è riproducibile dal catalogo realmente corrente.
- `dossiers/` conserva esiti, affermazioni, attrezzatura, limiti e checklist; nessuna approvazione indipendente è marcata completata.
- `sources.json` e `source-matrix.md` documentano autori, URL, data, localizzatori e dipendenze.

**Nessun dossier, hash o report storico viene riscritto.** Il nuovo `validation-cycle.mjs` valida prima il catalogo corrente completo, il registro, gli hash delle tre revisioni autorizzate e tutti gli altri file protetti. Soltanto dopo restituisce ai controlli P1.5/P1.6 i tre file archiviati esatti. I vecchi controlli restano attivi sulle rispettive baseline e i loro `--write` ora sono rifiutati. I dati correnti non sono coperti dalle vecchie fotografie: sono verificati separatamente dal comando P1.8 prima di ogni proiezione.

I test storici esplicitano la proiezione anziché dichiarare immutabili i file correnti. Test nuovi verificano modifiche non autorizzate, archivi alterati, dosi, promozioni, esiti pronti con criticità essenziali e tentativi di reimportare i vecchi draft. Le fixture CI restano separate dai record operativi.

## Visibilità e app locale

Policy, schema e registro URL non modificati; nessun demo cambiato. I tre draft restano esclusi da produzione e preview pubblica. L’audit statico controlla **insieme i payload archiviati e quelli correnti**, comprese nuove fonti, corpi e passaggi negli asset grezzi/compressi. I browser verificano ricerca/liste e URL diretti 404 con il catalogo attuale.

`npm run editorial` su http://127.0.0.1:4322/ continua a mostrare i tre draft. La scheda evidenzia l’esito P1.8 e le questioni essenziali, senza modificarne lo stato. I confronti pitta/gnocchi/bravas P1.6 restano immutati e non applicati. Le regole di isolamento P1.7 restano attive.

## Verifica e riproduzione

```sh
npm ci
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
npm test
npm run test:e2e
npm run test:editorial
```

`npm run editorial:validation -- --write` rigenera soltanto report e diff P1.8 dopo la validazione; non modifica record, decisioni, piano o snapshot. Le quattro configurazioni CI pubbliche e i test locali editoriali sono mantenuti. `validation-evidence.json` riporta solo le esecuzioni locali effettivamente completate; la PR distingue la CI sullo SHA finale.

## Questioni aperte e limiti

Gratin da revisionare prima della disponibilità per la review finale. Gattò e papas attendono review indipendente; nessuna prova pratica, validazione sensoriale o verifica delle etichette di specifici prodotti effettuata. La geografia delle Canarie è esplicitata come classificazione geografica del catalogo, distinta da Paese ES. Un mojo preparato da zero richiederebbe un dossier e una formula autonomi.

Nessuna immagine aggiunta. Nessun merge, auto-merge, deployment, modifica Aruba/WordPress, promozione editoriale o applicazione delle proposte P1.6. WebKit/Safari e Aruba non verificati.

## Risultati locali effettivi

`npm ci` completato. Tutte le quattro configurazioni della CI superate: produzione `/`, preview `/anteprima/`, produzione `/magazine/` con crescita sintetica e preview `/` HTTP locale. Per ciascuna: **114/114 test Node senza skip, 14/14 browser pubblici, 10/10 browser editoriali**; type checking con 0 errori/avvisi/hint, build statica, confronto byte per byte fra build consecutive, audit degli asset, controlli catalogo e storico/editoriali P1.3–P1.8. Totale della matrice finale: 456 esecuzioni Node e 96 browser Chromium desktop/mobile.

Audit con 78 marker sui payload precedenti e correnti, zero fughe. Verificati 80 file della baseline: esattamente tre revisioni autorizzate, tutti gli altri hash preservati. Fixture sintetiche e sessioni temporanee rimosse; dati operativi e dist invariati durante i test editoriali. La CI sullo SHA finale è riportata nella PR. Elenco completo dei file in `changes.md`.
