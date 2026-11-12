# P1.7 — Revisione editoriale locale e non distribuibile

Preflight: PR #7 integrata con merge `bab1ec69aa089b12a04f4249659ef05ca3f9d0d5`, main aggiornato, branch `feat/p1.7-private-editorial-preview`. Nessun lavoro editoriale applicato ai contenuti operativi.

## Avvio e uso

```sh
npm ci
npm run editorial
# Aprire http://127.0.0.1:4322/
# Terminare con Ctrl-C
```

È consentita soltanto una porta locale alternativa: `npm run editorial -- --port 4332`. Il solo host accettato è `127.0.0.1`; `--host 0.0.0.0`, `--host` senza valore, root, output e configurazioni CLI personalizzate vengono rifiutati. Non occorrono chiavi o password. Se la shell contiene BUILD_TARGET, BASE_PATH, HOST o SITE_URL di un ambiente pubblico incompatibile, il launcher rifiuta l’avvio: usare una shell priva di quei valori, non forzare i controlli.

L’indice distingue il catalogo operativo dalle tre proposte non applicate. La scheda mostra UUID, slug, nome, stato, demo/reale, ingredienti con quantità/intervalli, procedimento, fonti e date, note e campi mancanti. I tempi nulli sono dichiarati non quantificati, senza convertirli in zero. Nessun controllo di approvazione o modifica è presente.

## Ricette visualizzabili alla consegna

| Tipo | Ricette | Stato |
| --- | --- | --- |
| Operativi demo | Aloo gobi, Gnocchi di patate, Patate Hasselback, Patatas bravas, Pitta di patate, Rösti croccanti | draft, demo |
| Operativi reali P1.5 | Gattò di patate, Gratin dauphinois, Papas arrugadas con mojo | draft, non demo |
| Proposte affiancate | RP-0001 Pitta di patate salentina, RP-0039 Gnocchi di patate, RP-0079 Patatas bravas | candidate, non applicate; decisione P1.6 blocked |

La selezione è dinamica, non limitata a questi conteggi: candidate, draft e review del catalogo operativo sono ammessi dal selettore locale. Verified/published non fanno parte della coda di lavorazione. Le fixture CI esercitano anche candidate incompleti e review; non entrano nel catalogo consegnato. I 50 candidati di ricerca P1.2 non sono nuovi record operativi e non vengono importati da questa funzionalità.

Le proposte mantengono l’UUID della ricetta operativa e si aprono come confronti, non come duplicati del catalogo. Si vedono record attuale e proposedRecord P1.4, diff P1.6 campo per campo, SHA di precondizione ricalcolato, questioni aperte, motivazione e stato della decisione. Un mismatch SHA è evidenziato, non aggirato. La possibilità di leggere la proposta localmente non autorizza la sostituzione o modifica decisioni storiche.

## Architettura dei tre target

| Target | Implementazione | Dati e output |
| --- | --- | --- |
| production | Configurazione Astro e loader pubblici esistenti | Soltanto published, esclusioni originali invariate, output dist |
| preview | Configurazione Astro e loader pubblici esistenti | Comportamento demo P1.6 invariato; i draft reali restano privati, output dist |
| editorial | App Astro dev separata in editorial/src, avviata tramite API dev | Lettura locale P1.1, nessun output distribuibile |

La policy `src/catalog/policy.mjs`, il registro e il modello non sono modificati. Il selettore editoriale vive soltanto in `editorial/data.mjs`, fuori da `src/pages` e dal grafo delle pagine pubbliche. `readCatalog()` continua a validare schema, identità e relazioni; le proposte usano il medesimo recipeSchema. Non c’è un secondo modello di ricetta o una deroga nel loader pubblico.

Il launcher crea una directory privata 0700 con mkdtemp sotto la directory temporanea del sistema, fuori dal checkout. Root Astro, .astro, cache Astro/Vite, directory public vuota e qualsiasi percorso di output riservato restano nella sessione. Un link verso node_modules permette la risoluzione delle dipendenze; non è una copia dei contenuti o una destinazione di output. L’app legge i file sorgenti dal checkout in sola lettura.

Non viene eseguita alcuna build editoriale, neppure per i test. Il guard Astro ammette solo command=dev e rifiuta build, preview e sync. L’uso diretto del config sotto editorial fallisce; i build pubblici rifiutano editorial e target/env incoerenti. Nessuna directory editorial/dist viene generata. I percorsi risolti e l’indirizzo effettivo del listener vengono verificati, oltre ai valori d’ingresso.

## Isolamento HTTP e ciclo di vita

- Binding esclusivo a 127.0.0.1, porta fissa senza fallback su altre porte.
- Controllo del socket loopback, Host locale e Origin; metodi diversi da GET/HEAD rifiutati. Accessi raw a JSON/Markdown e /@fs rifiutati.
- Cache-Control no-store, noindex/nofollow/noarchive, referrer disabilitato; nessun Recipe JSON-LD o risorsa frontend remota.
- Cleanup della sola directory mkdtemp posseduta dalla sessione su stop, errore gestito ed exit. I test arrestano il server e rimuovono i temporanei in finally, anche in caso di fallimento.

**Limiti:** localhost non autentica la persona. Processi locali, utenti con accesso alla macchina, estensioni del browser o un tunnel/proxy deliberatamente creato possono leggere dati locali. Non inoltrare la porta e non pubblicare questa app. Noindex non è un controllo di accesso. SIGKILL, crash del sistema o perdita di alimentazione non consentono cleanup garantito: potrebbero restare cache private 0700 nell’area temporanea, mai in dist. Non presentiamo il dev server come una piattaforma sicura da ospitare online. L’API dev Astro è sperimentale: versione del lockfile e test di integrazione coprono il comportamento attuale.

## Test, CI e integrità

```sh
npm run test:editorial
npm run check
npm run catalog:check
npm run editorial:check
npm run editorial:consolidation
npm run integration:check
npm run editorial:enrichments
npm test
npm run test:e2e
```

`test:editorial` avvia il server locale, esegue Chromium desktop/mobile e lo arresta. Output Playwright esclusivamente nella sessione temporanea con destinazione fisica verificata; trace, video, screenshot, report HTML e conservazione degli output disattivati. I payload di errore dei test privati non sono stampati nei log CI. Il runner confronta gli hash prima/dopo dei file protetti e di tutto dist e verifica la rimozione della sessione.

Le quattro configurazioni CI pubbliche sono conservate. Ognuna esegue anche i test editoriali locali e ripete l’audit pubblico dopo la sessione. L’unico upload-artifact continua a riguardare test-results dei test browser pubblici; non include sessioni, cache o dati editoriali. Test negativi verificano target non distribuibile, host esterno, output condiviso, configurazione CLI editoriale, sorgenti raw e richieste estranee.

`baseline.json` registra gli hash degli artefatti P1.2–P1.6, contenuti operativi, registro, modello, policy e meccanismo P1.5 da preservare. Non vengono riscritti snapshot o dossier. Le evidenze effettive della matrice locale sono in `validation-evidence.json`; la PR riporta separatamente la CI sullo SHA finale.

## Attività ancora aperte

Review indipendente dell’isolamento, della UI e della lettura delle proposte. Restano revisione gastronomica e decisioni di applicazione delle tre proposte, senza promozioni automatiche. Nessuna modifica ad Aruba/WordPress, merge, deployment o applicazione degli arricchimenti. WebKit/Safari e hosting Aruba non verificati.

## Risultati locali effettivi

`npm ci` completato. Tutte le quattro configurazioni passano: produzione `/`, anteprima `/anteprima/`, produzione `/magazine/` con crescita sintetica, anteprima `/` HTTP locale. Per ciascuna: catalogo, controlli editoriali P1.3–P1.6, type checking (0 errori, avvisi e hint), build e riproducibilità, audit statico, **107/107 test Node senza skip, 14/14 browser pubblici e 10/10 browser editoriali**. Totale della matrice finale: 428 esecuzioni Node e 96 browser Chromium desktop/mobile.

Sessioni temporanee rimosse; output pubblici e contenuti operativi identici prima/dopo le sessioni. Verificati inoltre gli hash dei 77 file protetti contro la baseline del merge #7. Fixture di crescita rimosse. Nessun artefatto editoriale prodotto in dist o conservato dai test. Gli esiti CI sul commit finale sono nella PR. L’elenco completo dei file della modifica è in `changes.md`.
