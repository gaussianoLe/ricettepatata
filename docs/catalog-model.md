# P1.1 — Modello internazionale del catalogo

Schema versione 1, condiviso tra Astro Content Collections, validatore del catalogo e importazione. Implementazione in `src/catalog/schema.mjs`; validazione globale in `validate.mjs`, identità in `registry.json`. Campi sconosciuti vengono rifiutati, senza correzioni o promozioni editoriali implicite.

## Identità e compatibilità

`catalogId` è un UUID opaco in forma minuscola canonica, assegnato una sola volta. Le forme maiuscole sono rifiutate per evitare identità logicamente uguali ma stringhe diverse. Non dipende da titolo, lingua, provenienza, percorso del file o stato editoriale. Lo `slug` è un identificatore URL esplicito, in ASCII minuscolo con trattini. Il glob loader Astro usa `data.slug`, non il nome del file. Un record può essere spostato o rinominato sul filesystem senza cambiare URL.

Il registro riserva per ogni ID la coppia `{collection, slug}`: collisioni di ID, slug nella stessa raccolta o cambiamenti di identità causano errore prima del build. Anche gli ID ritirati restano riservati. Una futura migrazione di URL richiederà un progetto esplicito di redirect: non rinominare una chiave nel registro per eludere il controllo.

`legacy-routes.json` conserva la mappa degli URL P0 agli UUID. La migrazione ripetibile `node scripts/migrate-p0.mjs` converte solo i record P0 non ancora migrati, usa quella mappa e non riassegna identità ai record già convertiti. Tutti i demo sono **draft**, con fonte interna al prototipo: non sono stati verificati o promossi.

Gli URL delle sei ricette, due curiosità e due guide rimangono invariati **in anteprima**. In produzione i draft non generano pagine, collegamenti o URL nella sitemap: un vecchio URL demo riceve 404 finché il contenuto non viene pubblicato dopo revisione. Non è un cambio di slug. Questa distinzione è necessaria per rispettare il divieto di pubblicare contenuti non verificati; nessun deployment è stato effettuato.

L’adattatore `recipeView` mantiene i campi di presentazione usati dalla P0: titolo italiano, etichetta geografica, filtri Italia/Europa/Mondo, ingredienti e passaggi come stringhe, tempi e porzioni. I dati sorgente rimangono strutturati. Il totale include preparazione, cottura e riposo; non si sommano automaticamente le durate dei passaggi, che possono sovrapporsi.

## Campi comuni alle tre raccolte

| Campo | Formato e regole |
| --- | --- |
| `schemaVersion` | Intero `1` |
| `catalogId`, `slug` | UUID e slug immutabili, registrati |
| `names.italian` | Titolo italiano non vuoto |
| `names.original` | `{text, language}`; tag lingua come `it`, `de-CH`, `hi-Latn` |
| `names.alternatives` | Array di `{text, language}`; sinonimi non identificano da soli una ricetta |
| `description`, `date`, `demo` | Descrizione, data ISO `YYYY-MM-DD`, booleano esplicito |
| `editorial` | Stato e autore; revisore e date secondo le regole sotto |
| `externalIds` | Array `{namespace, value}`; identificatori esterni univoci nell’intero catalogo |
| `sources` | Array di fonti con ID locale univoco, `kind`, titolo, URL HTTPS, autore e data di consultazione |
| `notes` | Array `{id, kind, text, sourceIds}`; tipo `curiosity`, `history` o `culture` e riferimenti a fonti esistenti |

Fonti: `kind` è `primary`, `secondary` oppure `internal`. URL con credenziali o protocolli diversi da HTTPS sono rifiutati. `accessedAt` è una data di consultazione, non una prova automatica che la fonte sostenga una tesi. Le note citano gli ID delle fonti del proprio record; non possono avere riferimenti mancanti. Per verified/published ogni nota deve avere almeno una fonte esterna.

Curiosità e guide aggiungono `topics` (slug di argomenti) e `relatedRecipeIds` (UUID di ricette esistenti). La prosa resta nel corpo Markdown, con le relative citazioni da revisionare; le note strutturate sono adatte a singole affermazioni culturali/storiche e vengono mostrate con collegamenti alle fonti.

## Campi delle ricette

| Campo | Formato e regole |
| --- | --- |
| `provenance.continent` | `africa`, `asia`, `europe`, `north-america`, `south-america`, `oceania`, `antarctica`; null solo in candidate |
| `provenance.country` | `{code, name}`; codice a due lettere maiuscole, nome leggibile; null solo in candidate |
| `provenance.region` | Regione/area geografica testuale oppure null, distinta dai filtri P0 |
| `provenance.traditions` | Tradizioni gastronomiche dichiarate; non equivalgono a confini amministrativi |
| `taxonomy` | Array di ID controllati per `courses`, `cookingMethods`, `families`, `occasions` |
| `potatoRole` | `protagonist` oppure `secondary`; non viene dedotto automaticamente da pesi o titolo |
| `relation` | `{kind: "primary"}` oppure `{kind: "variant", primaryId: "UUID"}` |
| `duplicateOf` | Opzionale: UUID canonico di un record duplicato da riconciliare, mai pubblicabile |
| `timing` | `{prepMinutes, cookMinutes, restMinutes}`: interi non negativi; null per candidate incompleto |
| `servings` | Numero positivo, anche frazionario; null per candidate incompleto |
| `ingredients` | Ingredienti strutturati descritti sotto |
| `steps` | Passaggi ordinati con ID locale, testo, ingredienti coinvolti e durata facoltativa |
| `color` | Presentazione P0: `gold`, `green`, `pink` |

Il codice Paese è destinato a ISO 3166-1 alpha-2: il validatore controlla la sintassi a due lettere, non un’anagrafica geopolitica completa né la corrispondenza con il continente. Lingue, provenienza e tradizione restano soggette a verifica editoriale. Unknown geografici sono ammessi esplicitamente solo in candidate; non usare codici fittizi per eludere la revisione.

Le tassonomie ammesse sono esportate da `taxonomies` in `schema.mjs`; una nuova voce si aggiunge lì con documentazione e test. I valori di presentazione possono essere tradotti senza cambiare gli ID. La tassonomia ingredienti è rappresentata direttamente da `ingredients[].ingredientId`: non esiste una seconda lista da mantenere sincronizzata.

Ogni ingrediente ha `{id, ingredientId, name, quantity, optional, preparation?}`. `id` identifica la riga nella ricetta; `ingredientId` identifica l’ingrediente canonico nel catalogo (per esempio `patata`, `burro`). La stessa materia prima può ricorrere in più righe con ID di riga diversi. Quantità:

```json
{"value": 250, "unit": "g"}
{"value": 1, "max": 2, "unit": "tbsp"}
{"value": null, "unit": "qb"}
```

Unità misurate: `g`, `kg`, `ml`, `l`, `tsp`, `tbsp`, `cup`, `piece`, `pinch`. Quantità positive e massimo non inferiore al minimo; usare un numero decimale JSON (`0.5`), non la stringa `"1/2"`. `qb` richiede esplicitamente null. I passaggi sono `{id, text, ingredientIds, minutes?}`: i riferimenti sono agli ID delle righe ingrediente, non agli ID canonici. Sono ammessi riferimenti vuoti quando il collegamento non è ancora stato annotato; sono vietati riferimenti inesistenti e ID locali duplicati.

Oltre candidate sono obbligatori Paese, continente, tempi, porzioni, almeno due ingredienti e due passaggi, una riga canonica `patata` e almeno una portata, tecnica e famiglia. Il ruolo protagonist/secondary resta una scelta editoriale esplicita.

## Relazioni e deduplicazione

Validazione globale con indici Map/Set, senza scansioni quadratiche per cercare relazioni:

- UUID univoci tra tutte le raccolte, slug univoci per raccolta, identificatori esterni univoci per namespace/valore.
- Le varianti referenziano direttamente l’UUID di una principale esistente e canonica; niente autocollegamenti o catene di varianti.
- `duplicateOf` deve puntare a una ricetta esistente e non duplicata. Autocollegamenti, catene e cicli sono rifiutati; il duplicato non compare neppure in anteprima.
- Una variante published richiede principale published; un articolo published collega solo ricette published canoniche.

Titoli uguali o simili e nomi alternativi **non** causano fusioni automatiche: piatti omonimi possono appartenere a tradizioni diverse. Il validatore non pretende di riconoscere semanticamente tutte le ricette duplicate; una riconciliazione umana assegna ID canonici e relazioni. `externalIds` rende rilevabili duplicati da una stessa fonte senza confondere titoli e identità.

## Verifica e pubblicazione

| Stato | Completezza | Visibile in preview | Visibile in produzione |
| --- | --- | --- | --- |
| candidate | Scheletro ammesso | No | No |
| draft | Ricetta strutturalmente completa | Sì | No |
| review | Ricetta strutturalmente completa, in revisione | Sì | No |
| verified | Completezza, fonte esterna, revisore distinto, data di verifica; non demo | Sì | No |
| published | Requisiti verified e data di pubblicazione non precedente alla verifica | Sì | Sì |

`editorial` contiene `status`, `author`, `reviewer?`, `reviewedAt?`, `publishedAt?`. La verifica non può precedere la creazione o la consultazione delle fonti. Solo published può dichiarare `publishedAt`. La politica è identica per ricette, curiosità e guide, a prescindere dal `BASE_PATH`.

L’importatore ammette esclusivamente candidate/draft/review: non può promuovere verified o published. Il percorso umano atteso è candidate → draft → review → verified → published, con modifiche in Git, evidenze e review indipendente prima dell’approvazione. Lo schema valida lo stato attuale e le sue evidenze dichiarate; non implementa un servizio di autenticazione dei revisori o uno storico firmato delle transizioni. La veridicità delle fonti e delle dichiarazioni di verifica richiede il processo editoriale, non è deducibile da Zod.

## Scala e verifiche

Ogni avvio/configurazione Astro valida l’intero catalogo e il registro prima di caricare le raccolte. La logica delle pagine usa solo `visibleCollection`; ricerca e filtri mantengono gli identificatori di tassonomia e includono titoli originali, sinonimi e ingredienti. `matchesCatalogRecipe` supporta query e faccette AND per provenienza, ruolo patata, portata, tecnica, famiglia, ingredienti e occasioni; il layout P0 conserva i tre filtri geografici.

Un test genera e valida 5.000 candidate indipendenti. È una verifica del modello e degli indici, **non** un benchmark di build o browser su 5.000 pagine pubblicate. La ricerca corrente resta statica nel DOM; indicizzazione/paginazione per cataloghi molto grandi richiederanno una milestone dedicata.

Importazione JSON/CSV e staging: [catalog-import.md](catalog-import.md). Test e limiti: [catalog-validation.md](catalog-validation.md). Il funzionamento dei glob loader segue la [documentazione Astro](https://docs.astro.build/en/reference/content-loader-reference/).

## Estensione facoltativa P1.4: quantità approssimative

Una quantità numerica può aggiungere `approximate: true`, per esempio `{value: 2, unit: "l", approximate: true}`. `formatIngredient` rende “circa 2 l” e conserva eventuali intervalli; false o assente mantiene la resa precedente. Il campo non ha default, quindi non modifica i documenti già validati. Le quantità `qb` non ammettono questo metadato. Il booleano sopravvive all’importazione JSON/CSV nel consueto oggetto `ingredients`; un lettore strict precedente a P1.4 richiede aggiornamento per leggerlo. Nessuna identità, policy di pubblicazione o contenuto preesistente viene modificato dall’estensione.
