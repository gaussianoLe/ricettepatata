# RicettePatata.it — P0 Foundation

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

CI GitHub Actions esegue `npm ci`, type checking, test unitari, build, controlli HTML e test Chromium desktop/mobile per entrambi i target. Nessun workflow esegue deploy. Risultati e limiti in [docs/validation.md](docs/validation.md).

## Struttura

- `src/content/ricette`, `curiosita`, `guide`: Markdown validati dagli schemi in `src/content.config.ts` tramite Content Collections e glob loader.
- `src/components`: schede, illustrazione vettoriale originale e ricettario con ricerca.
- `src/layouts/Layout.astro`: navigazione responsive, SEO, canonical e JSON-LD.
- `src/lib`: configurazione dei percorsi e motore di ricerca, condivisi con i test.
- `src/pages`: homepage, indici, pagine editoriali e schede ricetta, robots e 404.
- `tests`: unità, integrità del build e percorsi browser.

La ricerca filtra titolo, Paese e ingredienti, ignora maiuscole e accenti e combina le parole con il filtro geografico. I filtri sono accessibili (`aria-pressed`), i risultati sono annunciati e la ricerca è condivisibile nell’URL. Le schede rimangono presenti e navigabili senza JavaScript. Il menu mobile usa stato espanso ed Escape. Non sono presenti tracker, font esterni, form di raccolta dati o credenziali.

## Contenuti e SEO

Sei ricette, due curiosità e due guide dimostrative; quindici pagine HTML. Per aggiungere una ricetta, copiare un Markdown esistente e compilare tutti i campi: slug dal nome del file, date, provenienza, tempi, porzioni, ingredienti e passaggi. L’editor deve mantenere gli slug stabili. Gli schemi impediscono contenuti incompleti. `demo: true` e gli avvisi visibili sono intenzionali: la P0 richiede revisione editoriale prima del lancio. La rimozione di questa limitazione richiederà aggiornamento esplicito dello schema e degli avvisi.

Dati strutturati WebSite, Recipe e Article, descrizioni, Open Graph testuale, canonical per pagina e sitemap di produzione. Nessuna valutazione, nutrizione o fotografia inventata nei dati Recipe. L’illustrazione decorativa non rappresenta il piatto reale e non è usata come fotografia nei dati strutturati. Non è garantita l’idoneità ai rich result Google: manca, tra l’altro, una fotografia editoriale per ricetta. Implementazione delle raccolte basata sulla [documentazione Astro](https://docs.astro.build/en/guides/content-collections/).

## Build e hosting

| Target | Comando | Base URL | Indicizzazione |
| --- | --- | --- | --- |
| Produzione | `npm run build` | `/` | Sitemap e canonical assoluti |
| Anteprima | `npm run build:preview` | `/anteprima/` | `noindex, nofollow`, senza sitemap |

`SITE_URL` accetta solo un’origine HTTP(S), senza percorso; `BASE_PATH` deve iniziare e terminare con `/`. Entrambi possono essere impostati nell’ambiente per il proprio dominio. Ogni build ricrea `dist/`: non mescolare gli output. `npm run preview` serve il build esistente: non crea il target anteprima. Il wrapper di preview legge il target salvato in `.astro/ricettepatata-build.json` dall’ultimo build e avvia Astro in primo piano con quel target. Per configurazioni personalizzate, mantenere le stesse variabili ambiente durante build e preview.

[Deployment manuale Aruba e protezione WordPress](docs/deployment.md). **Nessun deploy, accesso remoto Aruba o merge è stato eseguito da questo progetto.**
