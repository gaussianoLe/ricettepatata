# P1.6 — Revisione controllata degli arricchimenti

Base: merge PR #6 `f20de92df2a558de96f5aabe84ce8ccacf80ca20`, verificato dopo aggiornamento di main. Branch `feat/p1.6-controlled-enrichments`.

## Esito effettivo

**Tre revisioni preparate, zero arricchimenti applicati.** Gli stati decisionali sono distinti dagli stati editoriali P1.1: `blocked` qui significa sostituzione impedita; non è un nuovo stato di ricetta. Le proposte storiche rimangono `candidate`, i demo operativi restano invariati.

| Ricetta | Decisione | Motivo e rimandi |
| --- | --- | --- |
| RP-0001 — Pitta di patate salentina | `blocked` | [Decisione](RP-0001.json): formula e resa esaminate, tempi non sommabili senza assunzioni; blocco della preview e review indipendente pendente |
| RP-0039 — Gnocchi di patate | `blocked` | [Decisione](RP-0039.json): farina variabile e tempi a lotti esaminati, nessun totale inventato; blocco della preview e review pendente |
| RP-0079 — Patatas bravas | `blocked` | [Decisione](RP-0079.json): tecnica e salsa esaminate separatamente; sostituzione esplicitamente non approvata, identità/variante da deliberare e blocco della preview |

Il mandato P1.6 autorizza la revisione e l’eventuale applicazione completa, non impone tre sostituzioni. Il suo paragrafo 5 richiede di mantenere la proposta non applicata quando comporta esposizione indesiderata o regressione della preview: questa condizione ricorre per tutti e tre i record. Non servono conferme per completare i dossier; l’eventuale decisione sul ritiro dei demo e sulle sostituzioni rimane un’attività successiva, fuori da questa PR.

## Identità, SHA e diff

Per ogni record sono verificati UUID operativo, slug, percorso e SHA-256 contro la checklist P1.5 e il piano P1.4. I tre hash sono riportati nei file decisionali e nei [diff strutturati](diffs.json). Nessun nuovo ID operativo o duplicato. Le relazioni originali restano identiche.

I diff confrontano campo per campo il frontmatter corrente con `proposedRecord` P1.4, usando JSON Pointer fino a ogni valore modificato, anche negli array; valori assenti e null sono distinti. Non sono patch applicate. Le proposte P1.4 non fornivano un nuovo corpo Markdown: quello operativo è conservato e una sua riscrittura richiederebbe ulteriore review. Non si sostituisce soltanto il frontmatter lasciando implicitamente approvato un procedimento vecchio.

Le osservazioni P1.6 correggono le assunzioni da non fare nella futura applicazione: dosi non ridimensionate automaticamente, farina non fissa per ogni patata, condimento separato, tempi non sommati senza conoscere perimetro e lotti, nessuna nuova temperatura di frittura. Formula e precisazioni sono collegate alle [fonti effettivamente consultate](sources.json) nella [matrice](source-matrix.md). Le quantità restano quelle dei piani storici; la revisione non li riscrive e non crea una nuova formula operativa.

## Visibilità e blocco dell’applicazione

Oggi ciascun demo ha `demo: true`, `draft`, produzione non visibile e preview visibile. Ogni proposta P1.4 ha `demo: false`, `candidate`: il risultato sarebbe non visibile in entrambi i target. Anche un vero `draft` non dimostrativo sarebbe privato. Tenere `demo: true` con `draft`/`review` esporrebbe la bozza reale nella preview e non è una soluzione accettata.

Il report calcola queste condizioni dalla policy P1.5 effettiva, senza eccezioni per UUID o base path. Non si indebolisce il loader né si introducono copie di una stessa identità. I test browser verificano che i tre demo originali restino raggiungibili in preview e 404 in produzione; gli audit statici verificano che fonti e osservazioni delle proposte non siano finite negli asset, pur consentendo i dati dei demo già pubblicamente visibili in anteprima. Gli altri tre draft P1.5 rimangono privati con gli audit esistenti.

## Integrità, modello e riproduzione

`baseline.json` fissa gli hash dei contenuti operativi, del registro e degli artefatti P1.2–P1.5 al merge richiesto. Nessuno di questi file è modificato. P1.5 rimane un’evidenza storica immutata; i controlli esistenti continuano a funzionare e il catalogo corrente è validato separatamente con `validateCatalog` e `catalog:check`. Il nuovo guard rifiuta cambi operativi, autorizzazioni inventate, mismatch SHA, duplicazioni e promozioni. Le fixture di crescita restano input di test, non autorizzazioni editoriali.

**Nessun cambiamento al modello P1.1 necessario in questa PR:** `candidate` ammette `timing: null`; gli intervalli e le durate non quantificate rimangono nei rilievi con fonte. Una futura modifica per tempi strutturati va deliberata solo se serve a una conversione completa; qui non si forza un passaggio a draft con tempi inventati.

```sh
npm ci
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
```

`npm run editorial:enrichments -- --write` rigenera soltanto report e diff P1.6 dopo le verifiche; non può scrivere contenuti, registro o decisioni. Il comando normale confronta gli artefatti salvati con il risultato calcolato. Non esiste un’applicazione automatica/upsert. Ogni futura sostituzione necessita di una decisione individuale motivata e di nuove precondizioni; le decisioni presenti non possono diventare autorizzazioni cambiando un booleano.

## Questioni aperte

- Concordare il destino delle tre pagine demo nella preview prima di sostituirle con bozze reali private.
- Review indipendente delle tre decisioni e delle differenze; nessuna approvazione dichiarata.
- Completare riconciliazione temporale e testo per pitta/gnocchi, senza totale esatto inventato.
- Deliberare revisione o variante delle bravas, verificare il brodo effettivo e completare le istruzioni di frittura. Nessuna formula vegetariana attribuita alla proposta con pollo.
- Prove in cucina, WebKit/Safari e Aruba non eseguiti. Nessun merge, auto-merge, deployment o promozione a verified/published.

Gli esiti delle quattro configurazioni e lo SHA finale sono riportati nella PR. Gli audit locali sono registrati separatamente in `validation-evidence.json` quando realmente completati.

## Risultati locali effettivi

`npm ci` completato. Matrice completa superata nelle quattro configurazioni della CI: produzione `/`, anteprima `/anteprima/`, produzione `/magazine/` con crescita sintetica, anteprima `/` su HTTP locale. Per ciascuna: catalogo, type checking (0 errori, avvisi e hint), build, riproducibilità byte per byte, audit di tutti gli asset, **99/99 test Node senza skip e 14/14 test browser Chromium desktop/mobile**. Totale 396 esecuzioni Node e 56 browser. Controlli editoriali P1.3/P1.4, integrazione P1.5 e decisioni P1.6 superati. Fixture sintetiche rimosse.

Nessuna fuga rilevata degli altri tre draft P1.5 o dei materiali P1.6. Le pagine demo esistenti mantengono la loro visibilità precedente. `validation-evidence.json` riporta audit realmente eseguiti; gli esiti GitHub Actions sullo SHA finale sono documentati nella PR, non dedotti dai test locali.
