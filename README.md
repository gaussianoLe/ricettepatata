# RicettePatata.it — Catalogo e importazione controllata

Magazine gastronomico statico in italiano dedicato alle patate nel mondo. Astro 7, TypeScript strict e Tailwind CSS 4; nessun server applicativo richiesto sull’hosting.

## Avvio

Richiede Node **22.23.4 o successivo** (CI: ultimo Node 22) e npm. Eseguire dalla root del checkout:

```sh
npm ci
npm run dev
```

Aprire l’indirizzo stampato da Astro. Per sviluppo sotto un prefisso, impostare `BASE_PATH=/anteprima/`. I comandi usano `SITE_URL=https://ricettepatata.it` come origine predefinita; nessun URL interno è legato a quella stringa. Configurazioni opzionali in `.env.example` (copiare in `.env`, ignorato da Git).

## Verifica riproducibile

```sh
npm ci
npm run check
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run build:preview
TEST_TARGET=preview npm test
TEST_TARGET=preview npm run test:e2e
```

Le assegnazioni inline sono per shell POSIX; in PowerShell usare `$env:TEST_TARGET="preview"`. `npm test` esamina anche `dist/`: eseguire prima il build del target corrispondente. I test browser avviano e fermano un server Astro sulla porta 4321; la porta deve essere libera. `TEST_TARGET` seleziona le attese dei test, non cambia il build.

CI GitHub Actions esegue `npm ci`, type checking, test unitari, build, controlli HTML e test Chromium desktop/mobile in quattro configurazioni: produzione `/`, anteprima `/anteprima/`, produzione personalizzata `/magazine/` e anteprima HTTP sotto `/`. Il caso produzione personalizzata aggiunge fixture sintetiche per stati editoriali, varianti e duplicati nelle tre raccolte, verificando crescita del catalogo e assenza di contenuti non pubblicabili. Nessun workflow esegue deploy. Risultati P1.1 e limiti in [docs/catalog-validation.md](docs/catalog-validation.md); storico P0 in [docs/validation.md](docs/validation.md).

## Struttura

- `src/content/ricette`, `curiosita`, `guide`: Markdown validati dagli schemi in `src/content.config.ts` tramite Content Collections e glob loader.
- `src/components`: schede, illustrazione vettoriale originale e ricettario con ricerca.
- `src/layouts/Layout.astro`: navigazione responsive, SEO, canonical e JSON-LD.
- `src/lib`: configurazione dei percorsi e motore di ricerca, condivisi con i test.
- `src/pages`: homepage, indici, pagine editoriali e schede ricetta, robots e 404.
- `tests`: unità, integrità del build e percorsi browser.

La ricerca filtra titolo, Paese e ingredienti, ignora maiuscole e accenti e combina le parole con il filtro geografico. I filtri sono accessibili (`aria-pressed`), i risultati sono annunciati e la ricerca è condivisibile nell’URL. Le schede rimangono presenti e navigabili senza JavaScript. Il menu mobile usa stato espanso ed Escape. Non sono presenti tracker, font esterni, form di raccolta dati o credenziali.

## Contenuti e SEO

Il modello P1.1 usa UUID immutabili e slug registrati, nomi multilingua, provenienza strutturata, tassonomie, ingredienti/quantità e procedimento strutturati, fonti, note culturali, relazioni e stati editoriali. I contenuti sono validati individualmente con Zod e globalmente per identità e riferimenti prima dell’avvio Astro.

I dieci contenuti dimostrativi P0 sono migrati a `draft`, con fonti interne esplicitamente non verificate. Mantengono gli stessi URL in anteprima. **In produzione non generano pagine o link finché non diventano published dopo verifica:** il catalogo iniziale di produzione è quindi vuoto. Nessun demo è stato promosso per conservare artificialmente i conteggi della P0.

```sh
npm run catalog:check
npm run catalog:import -- docs/import/candidates.json
npm run catalog:import -- docs/import/candidates.csv
```

L’importatore esegue solo validazione per default. Può produrre una proposta in una directory nuova ed esterna al checkout, senza modificare i sorgenti o pubblicare. Importazioni di stati verified/published sono rifiutate. Per aggiungere contenuti occorre aggiornare anche il registro delle identità; non usare più lo schema P0. Non cambiare UUID o slug esistenti.

- [Modello e politica editoriale](docs/catalog-model.md)
- [Contratto JSON/CSV ed esempi completi](docs/catalog-import.md)
- [Verifiche P1.1 e limiti](docs/catalog-validation.md)

Dati strutturati WebSite, Recipe e Article, descrizioni, Open Graph testuale, canonical per pagina e sitemap di produzione. Nessuna valutazione, nutrizione o fotografia inventata nei dati Recipe. L’illustrazione decorativa non rappresenta il piatto reale e non è usata come fotografia nei dati strutturati. Non è garantita l’idoneità ai rich result Google: manca, tra l’altro, una fotografia editoriale per ricetta. Implementazione delle raccolte basata sulla [documentazione Astro](https://docs.astro.build/en/guides/content-collections/).

## Build e hosting

| Target | Comando | Base URL | Indicizzazione |
| --- | --- | --- | --- |
| Produzione | `npm run build` | `/` | Sitemap e canonical assoluti |
| Anteprima | `npm run build:preview` | `/anteprima/` | `noindex, nofollow`, senza sitemap |

Il target è esplicito (`production` oppure `preview`) e indipendente da `BASE_PATH`: una produzione sotto `/magazine/` mantiene sitemap e indicizzazione, mentre un’anteprima sotto `/` mantiene banner, `noindex, nofollow` e nessuna sitemap. I comandi di build impostano il target; per `npm run dev` il default è `production`, modificabile con `BUILD_TARGET=preview`. Target sconosciuti causano errore.

`SITE_URL` accetta solo un’origine senza percorso, query o credenziali e richiede **HTTPS in produzione**, anche con base personalizzata. Non esiste un bypass HTTP per la produzione. HTTP è ammesso esclusivamente con target `preview`, per sviluppo locale, ad esempio:

```sh
BUILD_TARGET=preview BASE_PATH=/ SITE_URL=http://localhost:4321 npm run dev
```

`BASE_PATH` deve iniziare e terminare con `/`. Ogni build ricrea `dist/`: non mescolare gli output. `npm run preview` serve il build esistente: non crea il target anteprima. Il wrapper legge **target, origine e base risolti** salvati dall’ultimo build in `.astro/ricettepatata-build.json`, così la successiva anteprima locale non dipende dalle variabili ambiente rimaste nella shell. Ricostruire il sito dopo aver cambiato queste impostazioni.

Per riprodurre una configurazione personalizzata, passare le stesse `SITE_URL`, `BASE_PATH` e `TEST_TARGET` ai controlli del build e browser; `BUILD_TARGET` serve anche al type checking Astro. Esempio:

```sh
BUILD_TARGET=production SITE_URL=https://cucina.example BASE_PATH=/magazine/ npm run check
SITE_URL=https://cucina.example BASE_PATH=/magazine/ npm run build
TEST_TARGET=production SITE_URL=https://cucina.example BASE_PATH=/magazine/ npm test
TEST_TARGET=production SITE_URL=https://cucina.example BASE_PATH=/magazine/ npm run test:e2e
```

Le verifiche confrontano pagine e link con le voci effettive delle raccolte, e i risultati dei filtri con il catalogo presente: l’aggiunta di ricette, curiosità o guide non richiede aggiornamenti di conteggi nei test. Le ricette usate per i percorsi di navigazione (Rösti e Gnocchi) rimangono esempi di regressione nominativi in anteprima; in produzione sono esclusi tutti i record che non soddisfano la politica editoriale.

Attività successive e criteri di completamento: [docs/follow-up.md](docs/follow-up.md).

[Deployment manuale Aruba e protezione WordPress](docs/deployment.md). **Nessun deploy, accesso remoto Aruba o merge è stato eseguito da questo progetto.**

## P1.2 — Lotto 01 ricevuto e analizzato

JSON e CSV del lotto fornito rappresentano gli stessi 50 candidati; il JSON è la fonte principale e il CSV è usato soltanto per controllare la coerenza, senza una seconda importazione. Il risultato è **0 record P1.1 accettati, 0 esclusi definitivamente, 50 da revisionare**, tutti ancora candidate nel formato di ricerca: mancano fatti richiesti dal modello, che non vengono inventati.

[Report e riepilogo del lotto](docs/research/lotto-01/README.md), [report JSON](docs/research/lotto-01/report.json) e [manifest dello staging esterno](docs/research/lotto-01/staging-manifest.json). Il pacchetto esterno è una quarantena di ricerca, non contenuto Astro: nessun file di `src/content` o registro sorgente è stato modificato.

`npm run catalog:survey` gestisce il formato ricevuto `research-candidates-v1`. Il comando generale `catalog:batch` senza input continua a mostrare il report di attesa per quell’invocazione; non descrive più lo stato del lotto 01 già ricevuto. Procedura generale: [docs/first-catalog-batch.md](docs/first-catalog-batch.md).

## Lavorazione editoriale P1.3

Dieci dossier del primo lotto, fonti consultate, decisioni e due conversioni P1.1 in draft sono conservati nell’[area editoriale](docs/editorial/first-ten/README.md), esterna ai contenuti Astro. `npm run editorial:check` controlla identità, riferimenti, artefatti e conservazione del catalogo. Non pubblica né applica record.
