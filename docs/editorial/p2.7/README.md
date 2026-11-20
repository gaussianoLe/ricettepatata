# Prime due schede — proposta per la decisione editoriale

Preparata il **19 novembre 2026**. **Nessuna approvazione registrata.**

| Scheda | Versione proposta | Immagine | Decisione documentale |
| --- | --- | --- | --- |
| [Gattò / RP-0011](RP-0011.md) | Formula Ruggiero, invariata; sei porzioni della fonte, tempi indicativi | Illustrazione AI dichiarata | Pronta per decisione dell’utente |
| [Papas / RP-0080](RP-0080.md) | Formula Bonviveur, invariata; mojo già pronto escluso dai tempi | Fer.., Commons CC BY 2.0 | Pronta per decisione dell’utente |

Le schede rimandano a ingredienti e procedimenti completi del catalogo. [decision.json](decision.json) identifica UUID, slug, file e hash effettivi; **non contiene record published, nuovi digest di autorizzazione o consenso**. [sources.json](sources.json) conserva pagine consultate, enti/autori, data reale, localizzatori e limiti delle affermazioni. Ruggiero e GialloZafferano non sono fonti indipendenti; il portale canario conferma il contesto, non le dosi Bonviveur.

## Che cosa è stato risolto

- Verifica delle formule e delle cautele già svolta nella PR #17, completata con due dossier decisionali, fonti e limiti espliciti.
- Crediti corretti secondo la provenienza, con un componente condiviso da pagina e card di homepage/catalogo: l’AI non genera più link fotografici vuoti né finti crediti CC; per Commons sono visibili titolo del file, autore, fonte, licenza e trasformazioni.
- Nessun bisogno di inventare marche, dosi del mojo o certificazioni allergeniche: la proposta mantiene l’accompagnamento già pronto e invita a verificare i prodotti effettivi.
- Regressioni sul legame tra proposta, file operativi e immagini; sui gate reali ancora chiusi; sulle didascalie renderizzate di entrambe le immagini.

## Stato dei gate

| Gate | Stato effettivo |
| --- | --- |
| Catalogo, identità, formule, immagini e registro URL | Invariati; entrambe draft |
| Verifica documentale dell’assistente | Completata; non è review indipendente |
| Review tecnica dell’assistente | [Completata il 20 novembre](technical-review.md); non è approvazione indipendente |
| Prova in cucina | Non eseguita: resa, consistenza e tempi non misurati |
| Review editoriale indipendente | Pendente, non simulata |
| Approvazione editoriale dell’utente | Da richiedere; non concessa |
| Merge | Non autorizzato |
| Deployment / Aruba | Non autorizzato; nessun accesso remoto eseguito |

Le quantità seguono le fonti, non una preparazione sperimentata dalla redazione. Allergeni effettivi e contaminazioni dipendono da prodotti e salsa scelti: nessuna dichiarazione di assenza. Il Gattò illustrato artificialmente non attesta una teglia cucinata.

## Verifiche riproducibili

`npm ci`, `npm audit --json`, tutte le validazioni storiche, `npm run check`, `npm run catalog:check`, `npm test`, build riproducibili production/preview, audit degli asset pubblici, `npm run test:e2e`, `npm run test:editorial`, `npm run test:release`.

Le quattro configurazioni sono production `/`, preview `/anteprima/`, production `/magazine/` con crescita sintetica e preview `/` HTTP locale. Matrice conclusa il **20 novembre**: per configurazione **148 test Node, 14 browser pubblici, 36 browser editoriali e 8 browser RC**, tutti passati; type checking senza errori, warning o hint. Ripetuta anche production sul componente crediti finale. Risultati effettivi in [validation-evidence.json](validation-evidence.json); URL CI e SHA finale nella PR. Le fixture sintetiche già presenti nei test restano copie temporanee, non approvazioni reali e non prove in cucina.

La prima matrice ha rilevato un falso positivo nel nuovo test del registro: lo scenario growth aggiunge temporaneamente nove identità. Corretto il confronto con il registro originale conservato dalla fixture, come nelle verifiche storiche, mantenendo intatti i controlli indipendenti sulle aggiunte e sul ripristino. La matrice completa è stata rieseguita con successo dopo la correzione; nessun test disabilitato, nessun hash operativo cambiato.

Audit npm del 19 novembre: il registro risponde **zero vulnerabilità** per il lockfile corrente. Il precedente rapporto P2.2 con undici high è storico, non il risultato di questa esecuzione. Nessuna dipendenza cambiata o advisory ignorato in questa PR; non viene attribuita una correzione mai realizzata qui.

## Proposta di decisione e passaggio successivo

La decisione richiesta riguarda **le due versioni esatte descritte**, inclusa l’illustrazione AI del Gattò e il mojo già pronto delle Papas, accettandone i limiti documentati. Non implica che siano state provate in cucina o approvate indipendentemente.

Solo dopo consenso esplicito sarà possibile predisporre la modifica editoriale verificabile dei metadati e dei digest previsti dal contratto esistente. Qui `release/authorization.json` resta false e `release/approved-records.json` vuoto. Nessun comando nuovo di promozione, nessuna modifica dei digest esistenti.

Merge e deployment richiedono autorizzazioni distinte. Prima di un eventuale deployment occorrono inventario e backup/ripristino verificabili, piano approvato di cutover e preservazione esplicita di **`/anteprima/`**, WordPress e relative risorse finché non diversamente autorizzato. Non si dichiara verificato il server né il suo backup. Rimane valido il [piano essenziale di deployment/rollback](../../release/p2.2/deployment.md).

## Rapporto con la PR #17

Branch dedicato creato dal suo SHA `bde9e61f680e41b471a8fbe26e0e67861143f2b5`, sopra main `4e9ed99c11aaee351336cdfb1b53effb03a48668`. La nuova PR verso main include il commit documentale della #17 come dipendenza, **senza averla mergiata**. Nessuna modifica ai dossier storici P1.x–P2.6, alle ricette operative, alle autorizzazioni o alle immagini. I due file locali non tracciati preesistenti non sono inclusi nella consegna.

I file locali non tracciati sono `release/assets/papas-arrugadas-con-mojo-ai.jpg` e `release/assets/ricettepatata_immagini_editoriali.zip`: lasciati intatti, non selezionati né inseriti nella PR. Il comando finale approved richiede un checkout pulito; l’eventuale confezionamento autorizzato andrà eseguito da un checkout pulito del commit revisionato. Questo non richiede di cancellare i file personali.
