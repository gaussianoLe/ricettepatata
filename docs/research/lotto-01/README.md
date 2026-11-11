# Lotto 01 — analisi del dataset fornito

Il JSON principale e il CSV alternativo sono coerenti: stessi 50 record, stessi 14 campi e valori, stesso ordine. ID, slug proposti e nomi non sono ripetuti nel lotto. Il CSV non è stato elaborato come secondo lotto e nessuna voce è stata importata due volte.

| Esito | Record |
| --- | ---: |
| Ricevuti dal JSON principale | 50 |
| Accettati come record P1.1 | 0 |
| Esclusi definitivamente | 0 |
| Da revisionare | 50 |
| Nuovi file Astro o identità registrate | 0 |

Tutte le voci conservano `stato_editoriale: candidate`. `review` nel report è una decisione di lavorazione, **non** una promozione allo stato editoriale P1.1 `review`.

## Motivi dell’esito

Il dataset si dichiara `research-candidates-v1` e `importable: false`. Il solo campo `nome` non distingue titolo originale, lingua e traduzione italiana; il ruolo protagonista/secondario della patata non è confermato; la relazione canonica è `da_stabilire`. Non sono forniti descrizioni di ricetta, ingredienti, quantità, procedimenti, tempi o porzioni. Le 50 fonti individuali sono vuote, senza autori o date di consultazione. La categoria preliminare è esplicitamente euristica e non è stata convertita nella tassonomia definitiva.

Il testo metodologico `note` non è stato usato come descrizione culinaria o evidenza di fonte. Paese e area restano dichiarazioni di ricerca preservate, non attribuzioni verificate. Non sono stati inventati dati per ottenere artificialmente 50 record validi P1.1.

## Collisioni e disambiguazioni

Tre slug proposti sono già riservati nel catalogo:

- `RP-0079` → `patatas-bravas`.
- `RP-0113` → `rosti`.
- `RP-0237` → `aloo-gobi`.

Non risultano collisioni tra gli UUID tecnici proposti e il registro attuale. Nove voci hanno corrispondenze lessicali con il catalogo o nel lotto: pitta salentina, gnocchi, patatas bravas, rösti, Hasselbackspotatis e le quattro voci Aloo. Le segnalazioni Aloo sono deboli e non dimostrano identità o varianti; non è stata applicata alcuna fusione o esclusione per somiglianza.

Tutti i dettagli per record, con codici motivazione, corrispondenze e dati mancanti, sono in [report.json](report.json). Un eventuale aggiornamento del catalogo richiede una nuova analisi: il report documenta lo snapshot del catalogo indicato dal suo fingerprint, non garantisce assenza di collisioni future.

## Provenienza degli artefatti

- [dataset.json](dataset.json): copia byte per byte del JSON fornito, fonte principale.
- [dataset.csv](dataset.csv): copia byte per byte del CSV fornito, usato solo come rappresentazione alternativa.
- [methodology.md](methodology.md): README fornito, conservato come documentazione e non come istruzione eseguibile o fonte individuale.
- [report.json](report.json): esito dell’analisi, non attestazione di verifica editoriale.
- [staging-manifest.json](staging-manifest.json): percorso del pacchetto esterno e impronte dei tre file ricevuti.

Le impronte SHA-256 nel report e nel manifest coincidono con i file ricevuti. Le copie di ricerca sono fuori dalle Astro Content Collections: non costituiscono pubblicazione di ricette.

## Staging eseguito

La quarantena è stata creata fuori dal checkout Git, sotto la cartella `tmp` del workspace. Contiene `lot-report.json`, `research-quarantine.json`, `source-inputs.json` e un `registry.json` invariato. Non contiene directory `content` né ricette Markdown P1.1; `importExecuted` rimane false. Lo staging preserva tutte le 50 candidate senza applicarle al catalogo.

Per rigenerare l’analisi usare `npm run catalog:survey` con i tre file sopra. Un eventuale nuovo staging richiede una destinazione nuova esterna; le directory esistenti non vengono sovrascritte. I controlli rifiutano modifiche del payload dopo la verifica o incoerenze fra CSV e JSON.

Prima di un’importazione P1.1 occorrono completamento documentato dei metadati richiesti, fonti individuali, decisioni su identità/varianti e nuova review indipendente. Nessun merge o deployment è stato eseguito.

## Verifiche della consegna

Installazione pulita `npm ci` riuscita con zero vulnerabilità riportate. Controllo del catalogo, type checking (0 errori/warning/hint), build e test superati localmente nelle quattro configurazioni: produzione `/`, anteprima `/anteprima/`, produzione `/magazine/` con fixture editoriali, anteprima HTTP `/`. Ogni configurazione supera 61 test Node e 10 casi Chromium desktop/mobile: 244 e 40 complessivi.

Nove regressioni nuove coprono il lotto effettivo, coerenza e riordino CSV, mismatch/campi/ID duplicati, stato candidate, dati mancanti, collisioni con record parziali, identità proposte stabili, quarantena senza applicazione, manomissione dopo confronto e CLI. Le copie sorgente mantengono gli SHA-256 originali, inclusi i terminatori CSV CRLF preservati da `.gitattributes`. Fixture CI rimosse e registro sorgente ripristinato; `git diff --check` passato. L’esito CI remoto sullo SHA finale è riportato nella PR #3; i risultati locali non sono una dichiarazione di CI verde.
