# P1.3 — Prime dieci schede editoriali

Base verificata: merge PR #3 `df247cc63b9cc30c369b83dff36be0dcddfa1f56`. Branch: `feat/p1.3-editorial-first-ten`. Consultazione web effettiva: **12 novembre 2026**, secondo la data del client Europe/Rome. La data non deriva dalla pubblicazione delle pagine o dal loro crawl. Dossier redatti con assistenza automatizzata; review indipendente e prove in cucina non ancora eseguite.

## Esito effettivo

| Ricerca | Scheda | Decisione | Questione principale |
| --- | --- | --- | --- |
| RP-0001 | Pitta di patate salentina | Duplicato/variante da risolvere | Proposta di arricchimento di `pitta-di-patate`, non nuovo UUID operativo |
| RP-0002 | Tiella barese | Revisione | Porzioni assenti nella formula scelta; formule alternative non intercambiabili |
| RP-0005 | Patate alla salentina con pomodoro e cipolla | Revisione | Denominazione esatta non confermata; fonti solo contestuali |
| RP-0039 | Gnocchi di patate | Duplicato/variante da risolvere | Proposta di arricchimento di `gnocchi` |
| RP-0011 | Gattò di patate | Revisione | Dosi e tempi discordanti; racconti storici non provati |
| RP-0077 | Tortilla de patatas | Revisione | Versione, riposi e conteggio dei tempi da fissare |
| RP-0079 | Patatas bravas | Duplicato/variante da risolvere | Slug e UUID esistenti preservati; nessuna duplicazione per aggirare la collisione |
| RP-0080 | Papas arrugadas con mojo | Pronta per conversione P1.1 in draft | Formula delle patate con **mojo già preparato**, non ricetta della salsa |
| RP-0062 | Gratin dauphinois | Pronta per conversione P1.1 in draft | Formula Eurial con precottura, scelta esplicita fra versioni documentate |
| RP-0063 | Tartiflette | Revisione | Tempo riassuntivo incoerente e seconda fonte parzialmente premium |

Sono stati preparati **10 dossier**, con **24 fonti consultate**, **2 record P1.1 draft esterni**, **5 casi in revisione** e **3 casi di identità da risolvere**. Nove candidate hanno riscontri diretti da almeno due responsabilità editoriali distinte; RP-0005 non ha due fonti dirette e non viene presentata come verificata. Le fonti di contesto non dimostrano la sua identità. Nessuno stato `verified` o `published` assegnato.

“Pronta per conversione” significa sufficiente per il modello P1.1 in stato draft e con l’ambito dichiarato. Non significa approvazione finale, prova in cucina o pubblicazione. Le decisioni e i conteggi sono controllati da `report.json`; i dossier rimangono candidate come schede di ricerca, mentre le due conversioni sono draft.

## Fonti, affermazioni e limiti

- `sources.json`: URL effettivamente consultati, titolo, autore nominato oppure ente editore esplicitamente indicato, data, valutazione e gruppo di indipendenza. I portali commerciali non sono presentati come autorità istituzionali.
- `dossiers/RP-xxxx.json`: identità di ricerca originale e UUID tecnico P1.2, nomi/lingua, geografia, ruolo della patata, osservazioni citate, formula scelta, prosa del procedimento originale, discordanze, decisione e questioni aperte.
- `source-matrix.md`: matrice derivata delle affermazioni, con fonti e sezioni per il riscontro. `supported` descrive il riscontro nella pagina, senza assegnare lo stato editoriale verified. Le inferenze redazionali e le informazioni irrisolte hanno etichette distinte.
- `search-log.json`: ricerche per la denominazione non confermata, limiti di accesso e URL tentati poi sostituiti. Non è un archivio integrale di tutte le pagine o dei risultati dei motori.
- `records.json`: normale envelope di importazione P1.1, senza estensioni allo schema. Nessuna applicazione ad Astro.
- `preserved-catalog.json`: hash dei contenuti preesistenti e del registro; il controllo dedicato rifiuta modifiche a questi file. Il report conserva anche fingerprint del catalogo e degli input editoriali.

L’indipendenza è valutata per responsabilità editoriale; domini diversi non provano automaticamente ricerche storiche indipendenti. Traduzioni italiane e ruolo della patata sono scelte redazionali dichiarate. Per RP-0005 nomi e provenienza restano ipotesi del dataset. Nessuna data di invenzione o attribuzione a un inventore è adottata senza documenti adeguati. La ricetta Ducasse è stata letta solo nella porzione accessibile: non ricostruita la parte premium. I testi dei dossier sono sintesi e riscritture, senza copie integrali delle fonti.

Per il gratin vengono mantenute le dosi della singola formula Eurial: non si mescolano temperatura e tempi di Alpes Isère o Laruelle. Le conversioni cl→ml e ¼ litro→250 ml sono equivalenze di unità, non dosi nuove. Il ruolo protagonista è condiviso nella tiella con riso e cozze, non una stima nutrizionale.

La geografia distingue Paese amministrativo e collocazione fisica: per le Canarie il Paese è Spagna, mentre il raggruppamento geografico `africa` è una decisione redazionale esplicita sostenuta dalla pagina GRAFCAN sulla posizione dell’arcipelago. Non viene copiato il continente del Paese.

Per le papas la fonte documenta esplicitamente il servizio con mojo; la sua dose non è quantificata e resta `qb` con nota. La salsa è già pronta: i 35 minuti sono quelli della sola preparazione delle patate e non comprendono la produzione del mojo. Non si combinano arbitrariamente dosi della salsa di altre ricette. L’acqua di cottura è circa 2 litri, non una misura esatta obbligatoria. Nelle due formule convertite nessun riposo è prescritto: `restMinutes: 0` rappresenta questa convenzione di pianificazione, non una misurazione sperimentale. I tempi restano quelli dichiarati dagli autori.

## Identità e separazione dalla pubblicazione

Gli UUID tecnici sono quelli già proposti da P1.2, verificati con il namespace originario e l’ID `RP-xxxx`; nessun ID dipende da nome o ordine. Nei tre casi già presenti, l’UUID di ricerca rimane una traccia di provenienza e il dossier indica separatamente l’UUID del catalogo da arricchire. Il collegamento non viene applicato automaticamente.

Le due nuove identità e gli slug proposti passano `planImport()` contro catalogo e URL riservati. Il piano viene soltanto validato: registro sorgente, demo e contenuti pubblicati restano invariati. Non si crea un nuovo staging di importazione né si applica quello P1.2. Tutto risiede in `docs/editorial/first-ten/`, fuori dai loader Astro; anche i draft qui presenti non generano pagine di anteprima, sitemap o risultati di ricerca.

## Controlli ripetibili

```sh
npm ci
npm run editorial:check
npm run check
npm run catalog:check
npm test
npm run build
npm run build:preview
npm run test:e2e
```

`editorial:check` verifica Zod, selezione, identità, fonti/riferimenti/date, decisioni, gate delle conversioni, corrispondenza con P1.1 e integrità degli artefatti derivati. Non verifica automaticamente la verità dei testi. Non modifica file senza `--write`; dopo una revisione consapevole, `npm run editorial:check -- --write` rigenera report e matrice. Questo comando non aggiorna i contenuti Astro o il registro e non risolve le questioni editoriali.

La CI esegue il controllo editoriale **prima** delle fixture temporanee di crescita e poi mantiene i controlli completi nelle quattro configurazioni previste. Le nuove regressioni coprono selezione/identità, promozioni rifiutate, collisione bravas e nomi già presenti, fonti assenti o alterate, indipendenza/accesso, conversioni per casi irrisolti, quantità/porzioni e CLI. Le fixture restano dichiaratamente sintetiche e non fanno parte dei dossier.

Restano da svolgere review indipendente, prove in cucina, verifiche WebKit/Safari e Aruba. Nessuna modifica Aruba/WordPress, merge, auto-merge o deployment autorizzato da questa consegna. L’esito remoto sullo SHA finale è documentato nella PR.

## Risultati locali della consegna

Eseguiti realmente: `npm ci` (zero vulnerabilità riportate), `editorial:check`, controllo catalogo, type checking (0 errori, 0 warning, 0 hint), build e test nelle quattro configurazioni: produzione `/`, anteprima `/anteprima/`, produzione `/magazine/` con fixture temporanee di crescita, anteprima HTTP `/`. Ogni configurazione supera 70 test Node e 10 casi Chromium desktop/mobile: **280 test Node e 40 casi browser** complessivi. Tutte le fixture sono state rimosse e il registro ripristinato. Nove nuovi test editoriali. `git diff --check` passato. I test WebKit/Safari e su Aruba non sono stati eseguiti; non è stato autorizzato un deployment. Esito CI remoto, SHA finale e richiesta di review indipendente sono nella PR della consegna.
