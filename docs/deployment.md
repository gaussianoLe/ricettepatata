# Deployment manuale su Aruba Hosting Linux

Il build è statico: si trasferiscono HTML, CSS, JavaScript e SVG; Node serve solo in sviluppo e CI. Queste sono istruzioni per un intervento futuro autorizzato. La P0 non accede ad Aruba, non modifica WordPress e non include automazioni di deploy.

## Anteprima isolata

1. Confermare con il titolare dominio e document root effettivi dell’hosting, verificare HTTPS e il metodo di trasferimento sicuro disponibile nel proprio piano. Non inserire accessi nel repository.
2. Eseguire localmente `npm ci`, `npm run check`, `npm run build:preview`, `TEST_TARGET=preview npm test` e `TEST_TARGET=preview npm run test:e2e`.
3. Verificare che `dist/index.html` abbia `noindex, nofollow`, canonical con `/anteprima/` e asset con lo stesso prefisso. Non cambiare il dominio con una sostituzione testuale: usare `SITE_URL` prima del build.
4. Prima di un caricamento approvato, salvare un backup e un inventario dei file remoti interessati. Se `anteprima` esiste già, verificarne proprietario e contenuti: non sovrascriverla alla cieca.
5. Trasferire **il contenuto** di `dist/` esclusivamente nella sottocartella verificata `anteprima/` della document root. Non copiare sorgenti, `node_modules`, `.env` o `.git`; non modificare file della root, `.htaccess`, `wp-config.php`, `wp-content`, `wp-admin` o `wp-includes`.
6. Verificare `/anteprima/`, `/anteprima/ricette/`, una ricetta, menu mobile, filtri, CSS e link profondi. WordPress e le sue regole possono intercettare le richieste: controllare la risposta reale prima di proporre qualsiasi cambiamento delle regole.

I meta robots sono presenti su ogni pagina di anteprima. Il `robots.txt` dentro `/anteprima/` non governa il dominio: i crawler leggono solo quello della root. Il robots di produzione genera `Allow` e `Sitemap` in base a `BASE_PATH`, senza dedurre dove sia ospitata l’anteprima. Un eventuale `Disallow` dell’anteprima nel robots della root va concordato sulla topologia reale e non aggiunto automaticamente (la produzione potrebbe essere ospitata proprio sotto quel prefisso). Non sostituire il robots WordPress senza revisione e autorizzazione. `noindex` non è controllo d’accesso: un’anteprima riservata richiede una protezione dell’hosting da configurare separatamente.

## Produzione, solo dopo approvazione esplicita

1. Approvare revisione indipendente, contenuti, immagini, comportamento della 404 e piano di convivenza/migrazione WordPress. Non caricare il build nella root finché questi punti non sono risolti.
2. Preparare un backup ripristinabile di file, database WordPress e configurazione. Concordare finestra e rollback. La presenza di `index.php` e `index.html` può cambiare la precedenza: non alterare `DirectoryIndex` o cancellare WordPress per risolverla automaticamente.
3. Eseguire `npm ci`, `npm run check`, `npm run build`, `npm test`, `npm run test:e2e`. Il target finale deve avere base `/`, origine corretta e sitemap senza `/anteprima/`.
4. Solo nel contesto di un deploy separatamente autorizzato trasferire gli output nella destinazione concordata e verificare home, pagine interne, canonical, asset, sitemap, robots, HTTPS e codici HTTP.
5. `404.html` è generato; il collegamento di una risposta 404 reale alla pagina dipende dall’hosting. Nessun `.htaccess` viene fornito o modificato dalla P0: la relativa regola va verificata rispetto a WordPress. `astro preview` e l’hosting possono gestire gli URL inesistenti diversamente.
6. In caso di problemi, ripristinare esclusivamente i file dell’intervento secondo l’inventario e il backup approvati, senza cancellazioni generiche. Non usare sincronizzazioni con opzioni delete.

Non esistono workflow di pubblicazione, chiavi SSH, password FTP, deploy token o istruzioni di caricamento automatico nel repository.

## Target e origine personalizzati

Il percorso non determina la modalità. `npm run build` produce sempre il target `production` e richiede un `SITE_URL` HTTPS; `npm run build:preview` produce sempre `preview`, anche con `BASE_PATH=/`. Solo per sviluppo locale il target `preview` ammette HTTP. Nessuna eccezione HTTP è prevista per un build di produzione. Banner, robots e sitemap seguono il target esplicito, mentre canonical e asset seguono origine/base risolti. Il comando locale `npm run preview` recupera tutte e tre le impostazioni dall’ultimo build.

Le prove su hosting Aruba e Safari/WebKit rimangono attività successive, tracciate con criteri di completamento in [follow-up.md](follow-up.md); non sono state eseguite durante il rework.
