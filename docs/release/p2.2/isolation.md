# Architettura, isolamento e tracciabilità

Il sito pubblico mantiene policy, loader e target production/preview originali. Il contesto `release/context.mjs` è sempre false nella build ordinaria: nessuna variabile d’ambiente attiva una RC. Soltanto `release/runtime.mjs` crea una sessione autentica, con copia sorgenti esterna temporanea e plugin Vite che seleziona esattamente i due UUID. Nessun valore draft viene falsificato in published durante la RC. La copia approved usa esclusivamente gli snapshot P1.1 già pubblicati dichiarati in PR.

La configurazione è congelata; buildRelease rifiuta sessioni forgiate, output condivisi o percorsi/host personalizzati. Cache, copia e sito sono sotto una directory privata 0700 creata dal processo. I sorgenti con symlink non sono copiati; node_modules è soltanto un collegamento controllato alle dipendenze, mai un payload. Il server statico accetta solo loopback, Host/Origin locali e GET/HEAD; nessun endpoint di approvazione. Il sito contiene soltanto file statici ammessi in una allowlist (HTML, asset client, sitemap, robots, immagini autorizzate).

Ogni altro UUID/slug, corpo e procedimento resta escluso. Le fonti condivise fra schede selezionate e altre schede non sono considerate da sole identificatori privati; identità e testi esclusivi restano auditati. I test richiedono 404 per Gratin, bravas, percorsi editoriali e JSON di autorizzazione. Nessun dossier operativo nell’articolo pubblico. La descrizione SEO usa l’introduzione letterale P2.1, l’autore pagina è l’organizzazione RicettePatata.it e le fonti della formula restano citation e attribuzioni visibili. I dettagli metodologici nelle righe ingredienti non entrano nei metadata pubblici; dosi e passaggi sono preservati.

## Guard storici

P1.x e i dossier P2.0/P2.1 non sono riscritti. Per le **sole due interfacce pubbliche** modificate (Layout e route ricetta), `interfaces.json` conserva SHA prima/dopo e copie byte-identiche `.astro.txt`. I check P2.0/P2.1 verificano prima lo SHA della versione corrente autorizzata, poi applicano gli assert storici ai byte precedenti. Non è un’esenzione dal controllo: manomissioni del file nuovo o dell’archivio falliscono. Nessun file catalogo passa attraverso questa proiezione. I test correnti verificano inoltre funzionalità, blocchi e visibilità reali.

## CI e fixture

Tutte le quattro configurazioni continuano a eseguire gli audit pubblici e i test storici. Il test RC costruisce due volte, confronta gli SHA, esegue browser/axe in una cartella temporanea senza screenshot, video o trace, verifica il percorso approved con dati sintetici committati soltanto in una repository temporanea e infine cancella tutto. La vera autorizzazione e i draft operativi vengono confrontati prima/dopo e restano invariati. La CI non carica artifact RC/editoriali; l’unico upload preesistente riguarda eventuali fallimenti browser pubblici.

Nessun accesso FTP/Aruba, deployment o promozione reale. Una RC noindex non è un ambiente da pubblicare: il blocco effettivo è l’isolamento del processo e dell’output, oltre all’autorizzazione esplicita richiesta dal ramo finale.
