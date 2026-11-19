# P2.5 — Preflight editoriale delle prime due ricette

**Stato: PREPARAZIONE. Non è un'autorizzazione alla pubblicazione.**

## Ambito e identità immutabili

- `RP-0011` — **Gattò di patate**, catalog ID `3f5f6cf2-d990-5bcb-92e5-9c388233acbb`, slug `gatto-di-patate`.
- `RP-0080` — **Papas arrugadas con mojo**, catalog ID `8bb84554-1db7-58df-a43a-c5bea8155ff0`, slug `papas-arrugadas-con-mojo`.
- Altre ricette e tutte le demo escluse dal rilascio.

## Stato registrato dopo il merge P2.4

- PR #15 mergiata il 19 novembre 2026 alle 14:41:21 UTC.
- `release/authorization.json`: `approved=false`, `approvedBy=null`, `approvedAt=null`, `recordHashes={}`.
- `release/approved-records.json`: elenco `entries` vuoto.
- Fotografie: Gattò con immagine AI dichiarata; Papas con foto Commons CC BY 2.0.
- Nessuna pubblicazione o deploy su Aruba autorizzati.

## Criteri operativi di preflight

| Gate | Evidenza tecnica richiesta | Responsabilità |
| --- | --- | --- |
| Integrità identità e contenuto | Digest SHA256 dei sorgenti draft invariati rispetto a `release/selection.mjs`; due ricette esatte | CI / tecnico |
| Qualità editoriale | Controllo di ingredienti, quantità, resa, passaggi, eventuali allergeni e attribuzione delle fonti | Revisore umano |
| Immagini | Validazione SHA256, dimensioni, provenienza, attributi alt, attribuzione Commons e marcatura AI | CI + revisore |
| Rendering | Release candidate isolata riproducibile; verifiche desktop/mobile, SEO, accessibilità, percorsi 404 | CI |
| Promozione dei record | Solo metadati editoriali consentiti, draft sorgenti invariati | PR di rilascio separata |
| Approvazione finale | Consenso esplicito dell'utente con digest dei due record; no approvazioni simulate | Utente |
| Deployment | Checklist rollback Aruba, conservazione `/anteprima/`, restore dei backup testato | Fase successiva autorizzata |

## Vincoli della fase

Non creare record approvati, non modificare i file `release/authorization.json` o `release/approved-records.json`, non impostare `approved:true`, non fare merge senza il workflow di review, non effettuare trasferimenti FTP o modifiche MySQL. I test sintetici di approvazione non rappresentano consensi reali.

## Output attesi dalla revisione

1. Due schede di verifica editoriale con osservazioni documentate e stato PASS/BLOCKED.
2. Evidenza della verifica tecnica, inclusi i gate di failure, prima di qualsiasi richiesta di approvazione.
3. Separata proposta di promozione dei record, soltanto dopo verifica dei contenuti e decisione editoriale.
