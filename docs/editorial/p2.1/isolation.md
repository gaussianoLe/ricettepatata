# Isolamento e SEO invariati

Il componente articolo è importato esclusivamente dalla route editoriale locale già esistente. Nessun endpoint pubblico, loader, policy, registro, record o stato viene modificato. Il nuovo modulo di presentazione vive sotto `editorial/`; il sorgente integrale e le note interne sono nel wrapper privato, non nel componente articolo. Noindex non è la protezione: resta il runtime P1.7 soltanto dev/loopback, Host/Origin, sola lettura e directory esterne temporanee; build/preview editoriali vietati.

Baseline indipendente di 148 file, inclusi catalogo, sorgenti di SEO/policy, runtime e tutti gli snapshot P1.x/P2.0. Il manifest deterministico riproduce la presentazione e i metadati esistenti. I test verificano anche canonical, Recipe, BreadcrumbList e robots dalla pagina effettiva. Nessun valore aggiunto a rating, recensioni, calorie, immagini o tempi.

Audit di tutti i file dist con gli strumenti P1.x/P2.0, più `ux:output` per gli estratti lettore e i marker dei nuovi componenti e del dossier. Riutilizza scanner per encoding JSON/HTML, escape Unicode, gzip e brotli; regressioni negative con dati codificati/compressi. Controlli eseguiti prima e dopo la sessione privata; fingerprint pubblico invariato. Gli URL diretti pubblici di entrambe le ricette e della pagina release devono restare 404, come da test esistenti.

CI conserva le quattro configurazioni e carica soltanto gli eventuali fallimenti browser pubblici. I test privati mantengono output temporaneo esterno, screenshot/video/trace/report HTML disattivati e cleanup obbligatorio. Il tool manuale screenshot rifiuta CI e output/host personalizzati, scrive nella sessione temporanea 0700 e cancella alla chiusura. Nessun screenshot nel repository o negli artefatti.

Questa modalità non è un server autenticato da rendere accessibile in rete: niente tunnel, proxy o inoltro porte. Non difende da un processo locale compromesso o da chi può leggere il checkout. Nessun deployment, prova Aruba o modifica WordPress.

I nomi ingredienti/dettagli che compaiono già nei contenuti visibili production/preview non identificano una bozza: il controllo aggiuntivo li confronta con il catalogo pubblico operativo prima di considerarli marker privati. I testi specifici, le classi del nuovo componente, UUID/slug/fonti/passaggi e gli audit storici restano controllati. Una regressione consente «olio extravergine» già pubblico ma rifiuta il nuovo markup anche accanto al termine condiviso. Non viene alterato alcun demo per far passare il controllo.
