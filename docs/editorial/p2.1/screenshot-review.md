# Screenshot review checklist — soltanto temporanei locali

Prima delle modifiche sono stati acquisiti quattro screenshot P2.0 (due ricette × 390/1440 px); dopo, quattro screenshot P2.1 alle medesime dimensioni, altezza viewport 960 px, intera pagina. Sono stati usati per la verifica visiva e rimossi con la sessione privata; non sono artefatti distribuibili o CI.

Per riprodurre P2.1: `node scripts/editorial-ux-screenshots.mjs`, con porta 4322 libera. Aprire i PNG nel percorso stampato mentre il processo è attivo. Il tool aggiunge le viste modalità cucina. Ctrl+C esegue il cleanup. Per riprodurre P2.0, avviare l’app editoriale di un checkout pulito del commit base `19507b4eabede713ca74f019372c38643945adab` e acquisire manualmente da DevTools le stesse due route, viewport 390×960 e 1440×960, screenshot full-page. Non cambiare branch in un checkout con modifiche e non avviare due server sulla stessa porta.

Checklist per review indipendente:

- [ ] Confrontare entrambe le ricette a 390 e 1440; non interpretare il fallback come foto del piatto.
- [ ] Verificare hero breve, tempi/porzioni immediati e spazio fotografico contenuto.
- [ ] Leggere quantità in grassetto, nomi e dettagli, senza perdere q.b./circa o vincoli essenziali.
- [ ] Controllare numeri/ordine e testo esatto dei passaggi in modalità normale e cucina.
- [ ] Verificare carta allergeni sempre visibile, conservazione distinta e nessun blocco importante chiuso.
- [ ] Espandere il dossier: corpo e ingredienti integrali, metodo e questioni aperte disponibili fuori dall’articolo.
- [ ] Provare 320/375/390/768/1024/1440, assenza overflow, tastiera, checkbox e assenza JS.
- [ ] Accertare che nessun PNG, trace o report privato sia stato aggiunto a dist o artifact CI.
- [ ] Chiudere il tool con Ctrl+C e verificare la cancellazione della directory temporanea.

Questa checklist è per il revisore: non rappresenta un’approvazione indipendente già ottenuta.
