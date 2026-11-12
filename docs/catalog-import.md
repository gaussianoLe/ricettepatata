# Importazione JSON/CSV — contratto v1

L’importatore valida e prepara una proposta per la review. Non scarica ricette, non modifica i contenuti sorgente, non accede ad Aruba e non pubblica automaticamente. Usa gli stessi schemi Zod e gli stessi controlli di relazioni del build.

## JSON

UTF-8, un unico oggetto con `formatVersion: 1` e un array `entries`:

```json
{
  "formatVersion": 1,
  "entries": [
    {"collection": "ricette", "data": {"schemaVersion": 1}, "body": "Testo Markdown"}
  ]
}
```

Il frammento sopra mostra solo l’involucro: `data` deve contenere tutti i campi del [modello](catalog-model.md). Esempio completo e validato: [import/candidates.json](import/candidates.json). `collection` è `ricette`, `curiosita` o `guide`; `body` è facoltativo e predefinito a stringa vuota. I record candidate possono essere incompleti nei soli campi autorizzati dal modello. Non inventare fonti o metadati mancanti per superare la validazione.

## CSV

UTF-8 con intestazione; BOM facoltativo; separatore virgola; quoting RFC 4180 con virgolette doppie raddoppiate; righe multilinea nei campi quotati. Esempio equivalente al JSON: [import/candidates.csv](import/candidates.csv). Parser: [CSV Parse Sync](https://csv.js.org/parse/api/sync/).

Le colonne hanno i nomi del modello, senza traduzioni:

```text
collection,schemaVersion,catalogId,slug,names,description,date,demo,editorial,sources,notes,externalIds,provenance,taxonomy,potatoRole,relation,duplicateOf,timing,servings,ingredients,steps,color,topics,relatedRecipeIds,body
```

- `collection`, `catalogId`, `slug` devono comparire nell’intestazione; le altre colonne dipendono dalla raccolta e dai campi obbligatori dello schema.
- Oggetti, array, booleani e numeri sono **JSON nelle celle**: `names`, `editorial`, `sources`, `notes`, `externalIds`, `provenance`, `taxonomy`, `relation`, `timing`, `ingredients`, `steps`, `topics`, `relatedRecipeIds`, `demo`, `schemaVersion`, `servings`.
- Stringhe semplici: ID, slug, descrizione, data, ruolo patata, `duplicateOf`, colore, corpo Markdown.
- Una cella vuota omette il campo; `null` JSON è diverso da vuoto ed è richiesto, per esempio, per `timing` e `servings` ignoti di un candidate. Array vuoti sono `[]`, non una cella vuota.
- Per un articolo lasciare vuote/omettere le colonne proprie delle ricette, e viceversa. Campi sconosciuti nella raccolta sono errori, non vengono ignorati.
- Intestazioni duplicate/sconosciute, righe con numero errato di colonne, JSON malformato e versioni sconosciute causano errore. Non si ignorano silenziosamente i record invalidi.

La singola riga CSV ha un limite di 5 MB. I formati vengono letti in memoria: dimensionare i lotti per migliaia di record, non trattarli come un flusso illimitato.

## Validazione e staging

Dalla root del checkout:

```sh
npm ci
npm run catalog:check
npm run catalog:import -- docs/import/candidates.json
npm run catalog:import -- docs/import/candidates.csv
```

Senza secondo argomento viene effettuata solo validazione: nessun file scritto. Per una proposta di migrazione ispezionabile:

```sh
npm run catalog:import -- docs/import/candidates.json /private/tmp/ricettepatata-import-proposta
```

La destinazione deve essere **nuova ed esterna al checkout anche nel percorso fisico**. Il genitore deve già esistere: `realpathSync` risolve il checkout e tutti gli antenati della destinazione prima di creare directory, così un symlink esterno diretto nel checkout viene rifiutato. Un alias verso una directory davvero esterna è ammesso e il comando restituisce il percorso fisico dello staging. L’importatore rifiuta directory esistenti e non sovrascrive file. Dopo la validazione dell’intero lotto insieme al catalogo esistente, scrive:

```text
ricettepatata-import-proposta/
  content/ricette/esempio-candidato.md
  registry.json
```

Il Markdown usa frontmatter JSON (sottoinsieme di YAML) e conserva il corpo. `registry.json` contiene il registro completo proposto, comprese identità già esistenti/ritirate. Le directory dello staging sono create esclusivamente con permessi `0700`, i file con `0600` e flag `wx`. Prima di scrivere vengono ricontrollati percorso fisico e identità filesystem (`dev`/`ino`) delle directory create. **In caso di errore non avviene alcuna cancellazione automatica:** lo staging parziale rimane per ispezione. Questo evita che il recupero errori possa eliminare una directory estranea sostituita allo staging. Per un nuovo tentativo scegliere una destinazione nuova; non riutilizzare automaticamente quella parziale. Nessun contenuto viene copiato automaticamente in `src/content`.

## Conflitti e riconciliazione

- Ogni nuovo record richiede un UUID assegnato una volta e uno slug stabile. Conservare gli stessi ID per tutti i lotti successivi.
- ID e record semanticamente identici (stessi dati normalizzati e corpo) sono ignorati come già presenti; il report distingue aggiunte e record saltati.
- Lo stesso UUID con dati, raccolta, slug o corpo diversi è un conflitto: aggiornamento manuale e review obbligatori. Nessun upsert distruttivo.
- Due UUID con lo stesso slug, un URL già riservato o lo stesso identificatore esterno sono errori. Non viene eseguita deduplicazione per titolo o traduzione.
- Relazioni a principali, duplicati o ricette collegate possono puntare a record esistenti o presenti nello stesso lotto; devono essere tutte risolte prima dello staging.
- Il lotto può contenere solo candidate, draft o review. Verified/published sono rifiutati anche se i relativi campi appaiono completi.

Dopo l’ispezione della proposta, un intervento Git separato sul branch di import può aggiungere i nuovi Markdown e aggiornare il registro. Rieseguire `catalog:check`, type checking, build, test e CI. I candidate non generano pagine nemmeno in anteprima. Una volta completata la ricetta, lo stato draft la rende ispezionabile nell’anteprima; la produzione resta esclusa fino alla verifica e alla pubblicazione esplicite.

## Copertura della review: porzioni numeriche e symlink

`servings` è deserializzato come scalare JSON, mantenendo numero o null anziché una stringa CSV. Un round-trip di una ricetta draft completa verifica l’equivalenza JSON/CSV, porzioni numeriche, tempi non nulli e validazione del piano di importazione.

I test di staging coprono alias esterni che puntano al checkout o a suoi discendenti, anche con un alias del checkout stesso; alias innocui verso directory esterne; destinazioni esistenti e sostituzione della directory in coincidenza con un errore di serializzazione. In quest’ultimo caso i dati della directory estranea rimangono intatti, senza cleanup ricorsivo.

## P1.4: proposte di arricchimento e precisione delle quantità

I piani in `docs/editorial/p1.4/enrichments.json` sono documenti di review manuale, non envelope d’importazione. L’importatore continua a rifiutare modifiche a UUID esistenti: nessun upsert o applicazione implicita è stato introdotto. Una proposta richiede review indipendente, autorizzazione e verifica della precondizione SHA prima di un intervento Git separato.

`quantity.approximate` è un booleano facoltativo per quantità numeriche; il JSON in `ingredients` lo mantiene anche nel CSV. `true` richiede una presentazione approssimativa (“circa”), senza inventare tolleranze numeriche. Schema v1 e colonne rimangono compatibili con gli input esistenti; per il nuovo metadato occorre un lettore P1.4.
