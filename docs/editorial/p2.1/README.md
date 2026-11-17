# P2.1 — Editorial UX Refinement

Base verificata: PR #11 merged, `19507b4eabede713ca74f019372c38643945adab`. Branch `feat/p2.1-editorial-ux-refinement`. Nessun merge, deployment, pubblicazione o promozione.

Le pagine locali di RP-0011 Gattò e RP-0080 Papas sono più rapide da leggere e consultare: hero sintetico, fotografia mancante dichiarata in poco spazio, quantità evidenziate, dettagli secondari separati, passaggi distinti e approfondimenti organizzati. Entrambe restano `draft`, `demo: false`; RP-0062 rimane escluso con `needs_revision`. Nessuna formula o fonte gastronomica modificata, nessuna nuova ricerca o prova in cucina dichiarata.

## Separazione articolo/dossier

`editorial/presentation.mjs` è una proiezione pura dei record P1.1: non uno schema di importazione o un secondo catalogo. L’introduzione è un estratto letterale del corpo revisionato. Quantità/unità sono derivate con `formatIngredient`, immutato. Nomi, obbligatorietà, procedimento, dosi, tempi, porzioni e note culturali restano operativi. Se un estratto non esiste più nel sorgente, la proiezione fallisce; non genera testo sostitutivo.

La nota metodologica del pangrattato e quella del mojo non sono più mescolate alla riga dell’ingrediente. Il vincolo dei 20 g di superficie resta visibile subito sotto gli ingredienti; il mojo già pronto e fuori dai tempi rimane nel nome, nel procedimento e nei tempi/limiti. Gli altri dettagli utili (fiordilatte da scolare, copertura dell’acqua) sono mostrati come testo secondario.

Il banner locale mantiene bozza/stato e assenza di prova in cucina. Nel pannello «Questioni aperte e asset mancanti», **fuori dall’articolo**, sono consultabili ingredienti integrali, corpo sorgente, decisioni metodologiche, questioni aperte, provenienza/esiti P1.8/P1.9 e collegamento al record operativo. Nessuna informazione viene cancellata dal catalogo o dai dossier. Questo pannello appartiene esclusivamente al wrapper editoriale: il componente articolo non lo incorpora.

`presentation.json` congela la proiezione, la mappa delle provenienze e il SEO esistente; `baseline.json` protegge 148 file operativi/storici, compresi tutti gli artefatti P2.0, helper SEO, policy, loader e runtime locale. I controlli P1.x e P2.0 restano attivi e invariati.

## Consultazione locale

Dalla root del checkout: `npm ci`, poi `npm run editorial`.

- http://127.0.0.1:4322/release/gatto-di-patate/
- http://127.0.0.1:4322/release/papas-arrugadas-con-mojo/

Il processo deve restare attivo. Non avviare contemporaneamente server/editorial browser test sulla porta 4322. Nessuna build privata distribuibile.

Per gli screenshot temporanei: arrestare il server corrente ed eseguire `node scripts/editorial-ux-screenshots.mjs`. Il comando apre il server soltanto su loopback, produce screenshot 390/1440 di entrambe le ricette, normali e in modalità cucina, in una directory temporanea 0700 esterna, stampa il percorso e attende la review. **Ctrl+C rimuove screenshot, cache e server.** Rifiuta CI e percorsi personalizzati; nessun PNG nel repository, dist o artifact CI. Vedere [checklist screenshot](screenshot-review.md).

## Verifiche e limiti

[Confronto prima/dopo e decisioni](ux-decisions.md), [responsive e accessibilità](responsive-accessibility.md), [isolamento](isolation.md), [evidenze effettive](validation-evidence.json), [file e SHA prima/dopo](changes.json).

Rimangono foto con licenza, review indipendente, prove culinarie e verifiche manuali con Safari/WebKit, Firefox, screen reader e hardware reale. Axe non dimostra conformità completa. Nessuna prova Aruba o intervento WordPress. Nessun cambiamento di canonical, JSON-LD, robots, visibilità o stato editoriale.
