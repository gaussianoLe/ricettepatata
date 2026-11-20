# P2.8 — Generazione controllata della proposta di approvazione

La PR **non pubblica ricette** e non modifica gli attuali gate: i draft e i digest originali restano invariati; `release/authorization.json` rimane `approved:false` e `release/approved-records.json` resta vuoto.

`node scripts/prepare-release-approval.mjs --reviewer="NOME REALE DEL COLLABORATORE" --reviewedAt=YYYY-MM-DD --publishedAt=YYYY-MM-DD --approvedBy="TITOLARE CHE HA DATO IL CONSENSO" --approvedAt=YYYY-MM-DD`

Il comando genera **solo su stdout** una proposta JSON con `approvedRecords` e `authorization`, non modifica file. Non usare identità, date o recensioni inventate. I valori devono risultare da dati verificati e dalle autorizzazioni già registrate. Se l'identità del collaboratore non è documentata, lasciare bloccata la promozione, senza spacciare l'approvazione riferita dall'utente per una firma GitHub del collaboratore.

Prima di adottare la proposta: verificarne i record e gli hash, assicurarsi che la data di consenso sia riferita allo stesso contenuto, salvare i due JSON nei rispettivi manifest solo in un'altra PR soggetta a review, verificare la release candidate e richiedere separatamente l'autorizzazione al deployment Aruba.

La review del collaboratore è stata **riferita dall'utente** nella conversazione del 20 novembre 2026, senza generalità o attestazione GitHub: questa PR non la trasforma in una verifica indipendente attestata.

## Identità del revisore comunicata

Il 20 novembre 2026 l'utente ha identificato come **Federico** il collaboratore che, secondo la sua comunicazione, ha esaminato e approvato le due schede. Questa è una dichiarazione del titolare del progetto, non una firma o una review GitHub di Federico. Usare esattamente il nome fornito, senza inventare cognome, account GitHub o data di review più precisa di quella verificabile. La data di pubblicazione non è ancora definita.
