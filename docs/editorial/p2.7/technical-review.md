# Revisione tecnica dell’assistente — 20 novembre 2026

**Revisione propria, non indipendente. Nessuna approvazione editoriale o di merge.**

Base: PR #17 `bde9e61f680e41b471a8fbe26e0e67861143f2b5`; main remoto `4e9ed99c11aaee351336cdfb1b53effb03a48668`.

## Rilievi risolti

1. Le immagini AI percorrevano il ramo dei crediti fotografici, producendo link senza autore/licenza, sia nelle pagine sia nelle card. Un componente di credito condiviso distingue ora le due provenienze. Il ramo AI conserva l’avvertenza che non si tratta di una preparazione reale e non genera link fotografici; Commons conserva titolo del file, Fer.., fonte, CC BY 2.0 e trasformazioni. Nessun asset sostituito.
2. Il nuovo controllo del registro confrontava le aggiunte sintetiche growth con il file originale. Ora legge la baseline salvata dal medesimo helper di fixture già usato dai controlli storici. Restano i controlli storici delle nove aggiunte e del ripristino, oltre al confronto dell’hash originale; nessun controllo escluso per far passare il catalogo.

## Verifiche della modifica

- Le uniche modifiche di rendering riguardano i crediti: nessun ingrediente, dose, procedimento, UUID, slug o metadato di stato è cambiato.
- Nessuna scrittura a `release/authorization.json`, `release/approved-records.json`, `release/selection.mjs`, registro o manifest immagini. Gli hash di `decision.json` identificano byte reali già esistenti, non metadati di approvazione.
- I nuovi dossier registrano review indipendente pendente, nessuna prova in cucina e consenso nullo. La matrice distingue la conferma della formula dalla conferma del solo contesto: non inventa fonti indipendenti.
- Le regressioni browser verificano i crediti effettivamente renderizzati sulle due pagine e sulle card di homepage/catalogo, oltre ai controlli preesistenti di accessibilità, SEO, filtri, base path e visibilità.
- La CI aggiunge i nuovi test alla lista già eseguita; non rimuove test, target o audit e non introduce deployment. Risultati locali in `validation-evidence.json`; esito remoto e SHA conclusivo nella PR.
- Nessun nuovo importatore, schema catalogo, sistema di autenticazione o comando di promozione. Gli archivi locali preesistenti non entrano nel commit.

## Questioni residue reali

- Decisione editoriale dell’utente e review editoriale indipendente ancora mancanti; una review propria non soddisfa il secondo gate.
- Prove in cucina non eseguite. Tempi e resa restano attribuiti alle fonti, immagine Gattò dichiarata AI, foto Papas illustrativa.
- Nessuna garanzia allergenica dei prodotti effettivi o del mojo non specificato. Le pagine invitano a verificarli e non fanno dichiarazioni di assenza.
- Nessuna verifica Safari/WebKit, lettore di schermo reale, backup/ripristino Aruba o inventario remoto; `/anteprima/` deve essere preservata in un eventuale piano autorizzato.
- Produzione approved ancora bloccata: nessun consenso reale o record published è stato creato. Un futuro confezionamento autorizzato richiederà il checkout pulito del commit revisionato, senza cancellare file personali.

Nessun rilievo tecnico bloccante residuo individuato nel diff dopo le correzioni; questo esito non certifica correttezza gastronomica sperimentale né autorizza pubblicazione, merge o deployment.
