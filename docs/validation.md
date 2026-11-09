# Verifiche P0

Verifiche locali eseguite il **9 novembre 2026** su macOS ARM64, Node 26.9.0 e npm 11.19.1. CI prevista su Ubuntu e ultimo Node 22 (Astro richiede almeno 22.23.4). Non viene dichiarata equivalenza con browser o hosting non testati.

| Verifica | Risultato locale |
| --- | --- |
| Stato remoto iniziale | `main` con commit `28efc60`, solo README; checkout pulito |
| Branch | `feat/p0-foundation` creato da `main` |
| `npm ci` | Passato, installazione pulita dal lockfile; zero vulnerabilità riportate |
| `npm run check` | Passato: 0 errori, 0 warning, 0 hint |
| `npm run build` | Passato: 15 pagine statiche, sitemap di produzione |
| `npm test` dopo build produzione | Passato: 5 test |
| `npm run test:e2e` produzione | Passato: 8 casi Chromium desktop/mobile |
| `npm run build:preview` | Passato: 15 pagine, prefisso `/anteprima/`, senza sitemap |
| `TEST_TARGET=preview npm test` | Passato: 5 test |
| `TEST_TARGET=preview npm run test:e2e` | Passato: 8 casi Chromium desktop/mobile |
| Controllo visivo | Homepage locale osservata in browser a larghezza mobile e desktop |
| `git diff --check` | Passato |

## Copertura

- Origine/base, rifiuto di configurazioni ambigue, prefissi dei link.
- Ricerca senza distinzione di accenti e maiuscole, più parole, combinazione geografica e input ostile trattato come testo.
- Tutte le pagine generate: canonical corrispondente alla pagina e al target, metadati, JSON-LD parsabile, link/asset locali esistenti, noindex di anteprima e 404, robots e sitemap coerenti.
- Homepage senza overflow orizzontale, menu mobile, Escape, skip link, navigazione schede, ingredienti/procedimento, filtri, reset, stato vuoto, URL di ricerca e ripristino dopo reload, link geografici, curiosità e guide, schede leggibili senza JavaScript.

## Correzioni emerse durante la verifica

- Lo starter locale aveva canonical su un dominio differente (`ricettapatata.it`, singolare), base anteprima fissa e workflow YAML malformato. Il nuovo repository usa il dominio richiesto, configurazione condivisa e CI a matrice.
- Astro 5 presentava avvisi di sicurezza nel registry: aggiornato ad Astro 7.4.7, installazione pulita con audit senza vulnerabilità.
- Astro 7 può avviare server in background nelle sessioni di agenti: il wrapper di preview lo avvia in primo piano, con il target salvato dall’ultimo build. La prima suite anteprima ha individuato il mancato prefisso del server; dopo la correzione sono passati tutti gli otto casi.

## CI e limiti

Il workflow `Foundation CI` esegue verifiche separate per produzione e anteprima, senza deploy. L’esito remoto autorevole è quello dei check associati all’ultimo commit nella PR; i risultati locali sopra non vengono presentati come prova di CI verde.

- Non testati Safari/WebKit, Firefox, lettori di schermo, dispositivi fisici o prestazioni su reti reali. Mobile emulato in Chromium.
- Nessuna certificazione di accessibilità completa; presenti verifiche mirate di focus, semantica e navigazione.
- Illustrazioni SVG originali decorative, nessuna fotografia editoriale. Schede e articoli sono demo da revisionare, non ricette già validate da una redazione.
- JSON-LD non verificato con Rich Results Test esterno; nessuna garanzia di risultato avanzato Google.
- Nessun accesso o deploy Aruba. Convivenza con WordPress, precedenza degli indici e gestione HTTP 404 dipendono dalla configurazione remota e sono documentate in `deployment.md`.
- Ricerca locale sul catalogo statico; nessun CMS, account, backend o raccolta dati.
