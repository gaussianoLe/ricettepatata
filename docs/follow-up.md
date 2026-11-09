# Attività successive alla P0

Backlog registrato dalla review indipendente della PR #1. Queste attività sono aperte e non costituiscono verifiche già eseguite o autorizzazione a modificare l’hosting.

## Estensione degli schemi editoriali

- [ ] Strutturare la provenienza: Paese/area geografica, cucina o tradizione, varianti e attribuzioni; migrare l’attuale `country` testuale senza perdere informazioni o cambiare gli URL.
- [ ] Aggiungere fonti: riferimenti bibliografici/URL, titolo, autore quando disponibile e data di consultazione; collegare i riferimenti alle ricette e alle affermazioni di curiosità/guide.
- [ ] Introdurre stato editoriale esplicito (demo, bozza, in revisione, pubblicato), autore, revisore e date di revisione; definire i requisiti per la transizione a pubblicato e la relativa visibilità nel build.
- [ ] Migrare il catalogo, sostituire il vincolo `demo: true` con le nuove regole, aggiornare avvisi e JSON-LD e aggiungere test per campi obbligatori, transizioni e contenuti esclusi dalla pubblicazione.

Completamento: modello documentato, migrazione delle tre raccolte, controlli di validazione e regole di pubblicazione testati; verifica editoriale indipendente di fonti e provenienza. Nessuna ricetta demo diventa pubblicata automaticamente.

## WebKit e Safari

- [ ] Estendere la suite CI a Playwright WebKit per i target standard e personalizzati.
- [ ] Verificare Safari su macOS e iOS reali: menu, focus/Escape, filtri e URL, link profondi, layout e contenuto senza JavaScript.

Completamento: versioni e dispositivi annotati, risultati riproducibili e regressioni risolte. L’emulazione mobile Chromium attuale non certifica Safari.

## Verifica Aruba e convivenza WordPress

- [ ] Concordare un intervento separatamente autorizzato con backup e inventario; confermare document root e destinazione di anteprima isolate.
- [ ] Verificare HTTPS, link e asset sotto prefisso, URL profondi, canonical, robots effettivo della root e risposta HTTP 404 reale.
- [ ] Verificare interazione con WordPress, precedenza `index.php`/`index.html`, regole di rewrite, cache e rollback senza cancellazioni generiche.

Completamento: evidenze HTTP e percorso verificato, WordPress preservato, piano di migrazione e rollback approvati. Nessun deployment automatico o produzione implicita in questa attività.
