# P2.0 — Preparazione del primo rilascio editoriale

Base: merge PR #10 `8ae5168d54283d61ba73369dd63b7f6b5a884825`, verificato merged prima del branch `feat/p2.0-first-editorial-release`.

**Due pagine pronte per revisione locale; zero ricette pubblicate o approvate.** I record restano `draft`, `demo: false`. Formule, UUID, slug, relazioni, registro, policy, loader e snapshot P1.x invariati byte per byte (baseline SHA-256 indipendente). Nessuna nuova ricerca web o consultazione di fonti gastronomiche: presentazione delle evidenze già raccolte P1.8/P1.9, senza aggiornare artificialmente le date.

## Architettura e avvio

`npm ci`, poi `npm run editorial`. Aprire esclusivamente:

- http://127.0.0.1:4322/release/gatto-di-patate/
- http://127.0.0.1:4322/release/papas-arrugadas-con-mojo/

Link presenti nell’indice privato e nelle schede operative. Il server deve restare in esecuzione; se la porta è occupata, arrestare la propria precedente sessione editoriale. Nessuna build editoriale da pubblicare.

`src/components/RecipeArticle.astro` riceve il record P1.1 e sezioni già revisionate. Riusa `Sources` e `EditorialNotes`; include identità, introduzione, provenienza, dosi, procedimento numerato, attrezzatura, limiti, allergeni, varianti separate, conservazione e fonti. Le sezioni mancanti non vengono fabbricate. Il template è collocato tra i componenti condivisibili, ma viene importato solo dall’app privata: il template pubblico esistente e i demo restano invariati. L’adozione pubblica richiederà una futura PR autorizzata.

`editorial/release.mjs` seleziona solo RP-0011/RP-0080, verifica draft reale, esito P1.9 e SHA operativo prima della visualizzazione. Le sezioni del corpo Markdown vengono estratte come testo e interpolate con escaping Astro, senza HTML arbitrario. Solo l’annotazione storica di migrazione «Fonte della formula: … draft precedente conservate» è omessa dalla lettura magazine; fonti e formule restano esposte nei campi strutturati e nella scheda operativa. Nessun secondo schema catalogo, upsert o scrittura.

Layout mobile-first con griglia progressiva, ingredienti selezionabili tramite checkbox etichettate, passaggi ordinati, link di salto e modalità cucina con testo più grande. Spunte e modalità sono solo in memoria; ricaricare le azzera. Nessun wake lock, timer, conto alla rovescia, archivio locale o dipendenza frontend aggiunta. Axe è una dipendenza di sviluppo, non inviata al browser del prodotto.

## Esiti editoriali

| ID | Identità | Stato | Esito P2.0 |
| --- | --- | --- | --- |
| RP-0011 | `3f5f6cf2-d990-5bcb-92e5-9c388233acbb` · `gatto-di-patate` | draft, reale | Pagina da revisionare; formula Ruggiero invariata; sei porzioni e budget cottura attribuiti, non misurati. |
| RP-0080 | `8bb84554-1db7-58df-a43a-c5bea8155ff0` · `papas-arrugadas-con-mojo` | draft, reale | Pagina da revisionare; formula Bonviveur invariata; mojo già pronto fuori dal calcolo dei tempi. |
| RP-0062 | `gratin-dauphinois` | draft, needs_revision nel dossier | Escluso dal rilascio e dalla nuova route; resta consultabile negli strumenti P1.x, alternativa P1.9 non applicata. |

Nessuna prova in cucina, nessuna review indipendente o promozione dichiarata completata. Consultare [checklist](checklists.md), [asset](assets.md), [SEO e dati strutturati](seo.md), [accessibilità](accessibility.md), [isolamento](isolation.md), [piano manuale e rollback](release-plan.md), [evidenze effettive](validation-evidence.json).

## Sicurezza e limiti

La pagina magazine è una simulazione locale del contenuto, con banner di bozza permanente e questioni aperte. Noindex è un segnale aggiuntivo: l’isolamento effettivo resta P1.7 (dev soltanto, loopback, Host/Origin, GET/HEAD, cache no-store, root/cache esterne temporanee, build vietata). Nessun controllo di approvazione/pubblicazione. Non è un servizio per più utenti e non difende da un processo locale compromesso o da chi può leggere il checkout. Non usare tunnel, reverse proxy o inoltri di porta. Non distribuire sorgenti/cache/docs: soltanto un futuro `dist` pubblico auditato.

Restano da svolgere: review indipendente, decisioni editoriali, eventuale prova in cucina, acquisizione/licenza delle foto e verifica con screen reader e Safari/WebKit reali. Nessuna validazione rich result da motore di ricerca o prova Aruba. Nessun merge, deployment, intervento WordPress o Aruba.
