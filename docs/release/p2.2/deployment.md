# Deployment essenziale e rollback — piano, non eseguito

Destinazione prevista: document root del dominio **https://ricettepatata.it/**. Il pacchetto è composto solo da HTML/CSS/JavaScript client, SVG e immagini: nessun Node/PHP/database necessario sul server. Node e Sharp sono strumenti di build sul computer/CI. La [guida Aruba Linux](https://guide.aruba.it/faq/hosting-e-domini/linguaggi-e-spazio-web-linux), consultata il 2026-11-18, documenta la priorità index.htm → index.html → index.php → index.shtml e la configurabilità dei MIME. È compatibilità architetturale; non una prova sul server effettivo.

## Prima di un trasferimento autorizzato

1. Completare review indipendente e PR con autorizzazione reale e snapshot P1.1 pubblicati esplicitamente. Risolvere foto Gattò o accettare il placeholder. Committare e rieseguire CI; generare con `npm run release:build -- --approved` esclusivamente per `/`. La RC normale non è distribuibile.
2. Conservare SHA Git, manifest/hash del pacchetto finale e autorizzazioni. Il comando mantiene l’output temporaneo fino a Ctrl+C: effettuare prima una copia locale controllata del pacchetto approvato; non copiare workspace, cache, docs, node_modules o manifest di autorizzazione sul server.
3. Ottenere inventario e backup **verificabili** della versione remota autorizzata precedente, inclusi document root, .htaccess, index.htm/html/php, robots/sitemap e backup WordPress/database. Nessuna connessione remota viene eseguita da P2.2. Senza inventario non si può classificare onestamente quali file remoti verranno sovrascritti.
4. Confrontare l’inventario col manifest del nuovo pacchetto. `output-differences.json` riporta aggiunte/modifiche/rimozioni rispetto alla **build statica corrente locale**, non pretende di essere un inventario FTP di WordPress. Le rimozioni remote pianificate sono **zero** finché non arriva una decisione specifica.
5. Esaminare priorità index.htm/index.html/index.php e rewrite WordPress. Non cancellare o sovrascrivere wp-config.php, wp-content, wp-admin, wp-includes, index.php o .htaccess alla cieca. Il nuovo index.html può cambiare quale homepage viene servita: il cutover richiede autorizzazione esplicita e backup. Nessuna regola .htaccess viene distribuita automaticamente.
6. Trasferire soltanto i file del pacchetto approvato, senza opzioni delete o sincronizzazioni generiche. Verificare HTTPS, homepage, entrambe le ricette, ricerca/filtri, correlate, canonical, robots/sitemap, 404 reali e MIME WebP/AVIF/JPEG; il fallback JPEG è presente. La configurazione 404 e gli eventuali AddType devono essere verificati rispetto all’hosting e a WordPress, non presunti.

## Rollback

Ripristinare soltanto i percorsi sostituiti dall’intervento dal backup autorizzato precedente. Rimuovere soltanto nuovi file elencati e confermati dal manifest d’intervento, mai directory WordPress o file estranei. Ripristinare eventuale configurazione index/rewrite esattamente dai backup, verificare homepage e URL precedenti e invalidare cache solo se autorizzato. Nessun comando di rollback remoto automatico.

Blocchi operativi: autorizzazione alla pubblicazione assente; scelta fotografica Gattò aperta; inventario/backup/cutover remoto non acquisiti, poiché non è consentito accedere o modificare Aruba. Non sono blocchi applicativi che richiedono un altro template o CMS.
