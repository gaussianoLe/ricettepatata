# P2.4 — Dossier di preparazione alla pubblicazione editoriale

Stato: **PREPARAZIONE / NESSUNA AUTORIZZAZIONE ALLA PUBBLICAZIONE**.

## Baseline verificata (19 novembre 2026)

- La PR #14 (P2.3) è stata mergiata il 19 novembre 2026 alle 12:50:16 UTC; integra il Gattò illustrato mediante AI e mantiene le Papas con immagine Wikimedia Commons CC BY 2.0.
- Foundation CI #60 sul commit P2.3 `bcfdbad6eb04456ac9b46fb505f187ab48bd68c3`: tutti e quattro i job sono passati prima del merge.
- `release/authorization.json`: `approved: false`, `approvedBy: null`, `approvedAt: null`, `recordHashes: {}`.
- `release/approved-records.json`: `entries: []`; nessuna ricetta è stata autorizzata come `published`.
- `release/context.mjs`: build ordinarie con `releaseCandidate=false` e `releaseArtifact=false`.
- Il cutover Aruba e la sostituzione dell'installazione WordPress sono **fuori ambito**.

## Perimetro editoriale

| Identità | Ricetta | Stato corrente | Immagine |
| --- | --- | --- | --- |
| RP-0011 / `3f5f6cf2-d990-5bcb-92e5-9c388233acbb` | Gattò di patate | `draft` | Asset generato, dichiarato come illustrazione AI; SHA-256 `971696f77dd8c551af01dddbd8d7bca59b01c11666d38b2e22abec2d320fdf1f` |
| RP-0080 / `8bb84554-1db7-58df-a43a-c5bea8155ff0` | Papas arrugadas con mojo | `draft` | Foto Wikimedia Commons attribuita a Fer.., CC BY 2.0; SHA-256 `e1baf6e8ed35cbd846cc503fde8a746b79bbab07a8dffc592b16d3d259a2766e` |

Le altre candidate, inclusa la Gratin dauphinois, sono escluse da questa release. Nessuna modifica alle formule, quantità, procedimenti, fonti, identità o slug è consentita tramite l'approvazione.

## Check prima di richiedere l'approvazione editoriale

- [ ] Verifica umana di ingredienti, quantità, procedimento, rese e tempi delle **due** ricette.
- [ ] Controllo umano su accuratezza delle fonti, tono editoriale, descrizione e identificazione di eventuali allergeni.
- [ ] Controllo umano del Gattò: illustrazione AI identificata come tale; non presentarla come fotografia di una preparazione reale.
- [ ] Controllo di licenza, autore e attribution per la fotografia Papas: CC BY 2.0 e trasformazioni dichiarate.
- [ ] Review visiva della release candidate isolata, desktop/mobile e accessibilità.
- [ ] Preparazione **separata** dei due record con soli metadati editoriali `published`, `reviewer`, `reviewedAt`, `publishedAt`; i record originali rimangono immutati.
- [ ] Verifica dei digest `recordDigest` di entrambi i record proposti, senza compilare o simulare il consenso.
- [ ] **Approvazione editoriale esplicita dell'utente** prima di aggiornare `approved`, `approvedBy`, `approvedAt`, `recordHashes`.
- [ ] PR di release dedicata, review indipendente e CI completa, senza merge fino a nuova autorizzazione.
- [ ] Piano di cutover Aruba autonomo: backup ZIP/SQL già acquisiti, verifica di ripristino ancora da eseguire, conservazione della directory `/anteprima/`, rollback documentato; deploy soltanto dopo autorizzazione separata.

## Politica fail-closed

Non impostare `approved:true` né generare attestazioni fittizie o hash di approvazione. Non modificare `release/approved-records.json` o `release/authorization.json` in questa fase. La CI su questa PR deve continuare a dimostrare che la pubblicazione non autorizzata è bloccata. Nessun FTP, MySQL, deploy o modifica al sito pubblico.
