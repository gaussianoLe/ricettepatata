# P1.2 — Lotto 01: 50 candidati gastronomici

Origine: selezione dal censimento esplorativo di 440 voci. Non sono 50 ricette verificate né complete.

**NON IMPORTARE DIRETTAMENTE IN ASTRO:** questo è un dataset di ricerca, non il contratto `formatVersion: 1` dell’importatore P1.1.

Ogni voce richiede: almeno una fonte attendibile verificata individualmente (URL, autore, data di consultazione); conferma dell’origine geografica e del ruolo della patata; ricetta originale redatta senza copiare testi protetti; ingredienti, quantità, porzioni, procedimento; disambiguazione di varianti e duplicati; revisione umana.

Pipeline: ricerca → verifica fonti → deduplica/varianti → redazione → conversione nel contratto JSON/CSV P1.1 → dry-run → staging → PR → review → eventuale pubblicazione solo dopo verifica.

Le categorie del censimento sono euristiche e non ancora la tassonomia Zod definitiva. Gli slug proposti sono indicativi e devono essere controllati contro il registro degli URL esistenti.
