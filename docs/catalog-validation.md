# Verifica P1.1 Catalog Data Model

Base: `origin/main` al commit `dc72557` (PR #1 già integrata). Lavoro sul solo branch `feat/p1-catalog-model`, senza modifiche dirette a main, merge o deployment.

## Copertura automatizzata

- Schemi Zod per tre raccolte, completezza per stato, quantità/tempi, tassonomie, fonti e note, riferimenti ai passaggi.
- Compatibilità dell’adattatore P0 e mappa di tutti gli URL storici; ID/slug indipendenti dal titolo e dal nome del file.
- UUID/slug/identificatori esterni duplicati, principali e varianti, duplicati canonici, catene/cicli e riferimenti mancanti.
- Politica di visibilità dei cinque stati nei due target e assenza di pagine, link e sitemap per record non pubblicabili.
- Ricerca multilingua e filtri strutturati, protagonismo della patata e ingredienti canonici.
- JSON/CSV equivalenti, Unicode, BOM, quoting e campi multilinea; file malformati, conflitti, idempotenza e divieto di promuovere i record tramite importazione.
- Staging solo in directory nuove fuori dal checkout, senza sovrascrittura o modifica del catalogo sorgente.
- Validazione di 5.000 candidate sintetici con ID distinti: verifica del modello, non benchmark end-to-end di un sito di 5.000 pagine.
- Integrità di tutti i documenti generati, canonical/base, robots e sitemap; test browser desktop/mobile Chromium, ricerca, menu, navigazione, pagine senza JavaScript e richieste dirette ai record esclusi (HTTP 404).

## Configurazioni della CI

Produzione `/`, anteprima `/anteprima/`, produzione personalizzata `/magazine/` con fixture di crescita e stati editoriali, anteprima HTTP sotto `/`. Ogni job esegue npm ci, type checking, controllo globale del catalogo, test del modello/importazione, build statico, controlli HTML e test browser.

Le fixture temporanee hanno identità proprie registrate e nomi di file diversi dagli slug. Includono tutti gli stati, una variante, un duplicato e articoli pubblicati sintetici. Fonti e revisori dei fixture sono dichiarazioni fittizie di test, non evidenze editoriali; non vengono inclusi nei commit, consegnati come contenuti o distribuiti.

Gli esiti locali e remoti effettivamente ottenuti sono riportati nella PR sul commit finale.

## Limiti e verifiche successive

I dieci demo sono ancora draft e non verificati; i loro URL sono conservati in anteprima, ma non esposti in produzione. Nessun contenuto reale published è stato aggiunto da questa milestone.

La validazione verifica forma e coerenza delle evidenze dichiarate, non la veridicità di fonti, traduzioni o attribuzioni, né l’identità autenticata del revisore. I codici geografici sono controllati sintatticamente; non è inclusa un’anagrafica geopolitica completa. Non viene effettuata fusione semantica per nomi simili.

Importazione sincrona a lotti e ricerca DOM della P0: non sono un’infrastruttura di ingestione streaming o un indice full-text per migliaia di pagine. Indicizzazione/paginazione e benchmark di build su un grande catalogo reale rimangono da pianificare.

WebKit/Safari, dispositivi reali e hosting Aruba/convivenza WordPress non sono stati verificati. Attività aperte in [follow-up.md](follow-up.md). Nessuna garanzia aggiuntiva sui rich result Google.

## Risultati locali eseguiti

Verifiche locali il 9–10 novembre 2026, macOS ARM64, Node 26.9.0/npm 11.19.1:

- `npm ci` riuscito dal lockfile aggiornato; zero vulnerabilità riportate.
- `catalog:check`, type checking (0 errori, warning e hint) e build passati in tutte e quattro le configurazioni della matrice.
- `npm test`: 28 test passati per configurazione, 112 complessivi.
- Playwright: 10 casi desktop/mobile Chromium passati per configurazione, 40 complessivi.
- Esempi JSON e CSV validati con il comando di importazione in modalità senza scrittura. Staging esterno verificato dai test.
- Migrazione ripetuta dopo la conversione: zero file modificati, stesse identità e slug.
- Nove fixture sintetiche temporanee usate nel caso produzione personalizzata, poi rimosse con ripristino del registro.
- `git diff --check` passato. Catalogo consegnato: dieci draft, nessun published; tutte e dieci le pagine editoriali conservate in anteprima e nessuna generata in produzione.

Questi sono risultati locali realmente eseguiti. Lo stato CI remoto sullo SHA finale è indicato nella PR; non viene dedotto da questa tabella.

### Portabilità su checkout CI pulito

Il primo run remoto ha rilevato che lo script delle fixture presupponeva una directory `.astro` già creata dai build locali. Lo script ora la crea esplicitamente. Un test di regressione prepara un catalogo temporaneo senza `.astro`, esegue aggiunta e rimozione delle fixture e verifica il ripristino esatto del registro e l’assenza dei file temporanei. Dopo la correzione, l’intera matrice locale è stata rieseguita con 28 test Node e 10 browser per configurazione. L’esito CI remoto finale resta documentato nella PR sul relativo SHA.
