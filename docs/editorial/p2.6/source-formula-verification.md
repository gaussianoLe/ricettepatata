# P2.6 — Verifica puntuale delle due ricette (senza pubblicazione)

Stato: **verifica documentale completata / approvazione editoriale e prova in cucina non svolte**.

Verifica del 19 novembre 2026, su `src/content/ricette/gatto-di-patate.md` e `src/content/ricette/papas-arrugadas-con-mojo.md`. Confrontate direttamente le fonti di formula dichiarate:
- Gattò: https://www.antonioruggiero.com/ricette/gateau-di-patate/
- Papas: https://bonviveur.com/es/recetas/papas-arrugadas

Le ricette non vengono riscritte né promosse. I file operativi restano draft e preservano gli hash immutabili in `release/selection.mjs`.

## RP-0011 — Gattò di patate

**Confronto con Antonio Ruggiero — verifica documentale: PASS.**

- Porzioni: **6**, teglia **20 × 20 cm**; la fonte indica preparazione **30 min** e cottura **70 min**.
- Ingredienti numerici coerenti: patate 500 g, fiordilatte 100 g, salame napoletano 50 g, prosciutto cotto 50 g, Parmigiano nel composto 2 cucchiai, uova 2, pangrattato superficie 20 g, Parmigiano superficie 30 g. Olio, pepe e sale q.b.
- Sequenza coerente: lessatura 30–40 min dal bollore; schiacciatura a caldo; amalgama; pirofila unta e impanata; forno statico 180 °C per circa 30 min.
- **Punto da chiarire in review:** la fonte richiede pangrattato anche sulla pirofila ma non ne dà una quantità distinta dai 20 g della superficie. Il catalogo mantiene correttamente una voce aggiuntiva q.b. (senza attribuire alla fonte una massa inesistente).
- **Punto da chiarire in review:** `prepMinutes=30`, `cookMinutes=70` descrivono categorie dichiarate dalla fonte, non una prova cronometrata; non presentare 100 minuti come durata garantita.
- Allergeni desumibili: latte, uova e glutine (pangrattato comune); verificare le etichette dei salumi.
- Foto Gattò: illustrazione AI, non immagine di una prova culinaria. Hash e dimensioni gestiti dalla P2.3.
- **Esito:** PASS per fedeltà delle dosi e della sequenza alla fonte; **BLOCKED per pubblicazione** finché manca revisione editoriale indipendente, conferma allergeni del prodotto usato e decisione di pubblicazione. Nessun test in cucina attestato.

## RP-0080 — Papas arrugadas con mojo

**Confronto con Bonviveur / Sofía de la Torre — verifica documentale: PASS.**

- Dosi **4 persone**: patate piccole 500 g, sale grosso 75 g. Circa 2 litri d'acqua per coprire, quantità indicativa e non ingrediente finale consumato.
- Preparazione **5 min**, cottura **30 min**: circa 20 min di bollitura e circa 10 min di asciugatura sul fuoco basso, dopo aver scolato tutta l'acqua.
- La fonte contempla mojo picón, rosso o verde come accompagnamento; non fornisce in questa formula dosi né tempi per prepararlo. Il catalogo lo registra correttamente come `q.b.` e già pronto.
- Non trasferire alla ricetta composta con mojo qualunque dichiarazione `senza glutine` / `vegano` valida per le sole patate: verificare la salsa specifica.
- La fonte segnala che le varietà comuni possono presentare rughe meno marcate rispetto alle patate canarie tradizionali.
- Foto Papas: immagine Commons, dichiarazione CC BY 2.0 e obbligo di conservare autore, fonte, licenza e modifiche.
- **Esito:** PASS per fedeltà delle dosi e del procedimento alla fonte; **BLOCKED per pubblicazione** finché mojo effettivo, allergeni, review indipendente e consenso editoriale non sono definiti. Nessun test in cucina attestato.

## Separazione dei gate

| Gate | Gattò | Papas |
| --- | --- | --- |
| Verifica di coerenza formule con fonti primarie di ricetta | PASS documentale | PASS documentale |
| Integrità immagini e generazione asset | PASS CI P2.3 | PASS CI P2.3 |
| Test release candidate isolata | PASS CI #60 P2.3 e #64 P2.5 | PASS CI #60 P2.3 e #64 P2.5 |
| Prova di cucina e assaggio | NON ESEGUITA | NON ESEGUITA |
| Review editoriale indipendente contenuti | NON ESEGUITA | NON ESEGUITA |
| Autorizzazione di pubblicazione reale | NON CONCESSA | NON CONCESSA |

## Condizioni per il prossimo passaggio

Non modificare `release/authorization.json` o `release/approved-records.json`, non falsificare la review o l'assaggio, non modificare gli hash/draft, non fare deploy. Un successivo passaggio potrà predisporre una proposta editoriale verificabile e separata, da approvare espressamente prima della promozione dei record.
