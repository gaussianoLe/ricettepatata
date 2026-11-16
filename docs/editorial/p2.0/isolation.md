# Separazione degli output

Il template condivisibile è importato solo dalla root sorgente editoriale; nessuna route o import dati nuovo in `src/pages`. Produzione e anteprima mantengono policy, loader e pagina pubblica invariati, protetti dalla baseline. `draft` reali esclusi dalle Content Collections pubbliche, quindi catalogo, ricerca, filtri, pagine, sitemap e JSON-LD non li ricevono. Non è un filtro CSS e non dipende dal noindex.

Il server editoriale conserva il gate P1.7: solo `127.0.0.1`, richieste locali Host/Origin ammessi, sola lettura GET/HEAD; raw JSON/Markdown/@fs negati; output/cache in directory temporanea privata esterna, mai dist. Build/preview/sync editoriali vietati dal config hook. Nessun autenticatore fittizio o segreto.

`release:check` verifica hash indipendenti di tutto il catalogo, registro, policy, loader e snapshot P1.x/P1.9 e selezione esatta dei due draft. `release:output` e il test output auditano **tutti** i file dist e riusano il controllo P1.5 per marker UUID, slug, descrizione, corpo, fonti e passaggi (incluse forme JSON/HTML e gzip/brotli). Ulteriori marker delle nuove route, testi fallback, stato bozza e codice cucina non possono entrare negli asset pubblici. I test pubblici richiedono 404 sia per `/ricette/{slug}/` sia per `/release/{slug}/`, anteponendo la base configurata. Anche RP-0062 resta escluso.

Ogni job CI esegue i check prima delle fixture, i test con eventuali fixture di crescita, build, audit, riproducibilità e browser; quindi l’app privata e un secondo audit pubblico. Le fixture sono rimosse in finally/always. La CI continua a caricare solo i fallimenti browser **pubblici**; i test privati rimangono esterni temporanei, senza artefatti.

Quattro configurazioni: production `/` HTTPS definitivo; preview `/anteprima/`; production `/magazine/` su dominio di test con crescita sintetica; preview `/` HTTP localhost. Nessun output editoriale statico generato.
