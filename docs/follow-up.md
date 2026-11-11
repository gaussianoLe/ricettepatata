# Attività successive alla P0

Backlog registrato dalla review indipendente della PR #1. Queste attività sono aperte e non costituiscono verifiche già eseguite o autorizzazione a modificare l’hosting.

## Estensione degli schemi editoriali — implementata in P1.1

- [x] Identità/slug stabili e provenienza geografica strutturata, titoli multilingua, tassonomie, principali/varianti e ruolo patata.
- [x] Fonti strutturate con URL, autore e data di consultazione; riferimenti per note di storia, cultura e curiosità.
- [x] Stati candidate/draft/review/verified/published, autore, revisore e date; vincoli Zod e gate di generazione per target.
- [x] Migrazione dei demo a draft senza cambiare gli slug; test di compatibilità e importazione JSON/CSV con staging separato.

Modello, regole e limiti documentati in [catalog-model.md](catalog-model.md). Rimangono aperte la revisione delle fonti e dei contenuti reali, l’anagrafica autorevole di ingredienti/luoghi e l’eventuale servizio autenticato con audit delle transizioni editoriali. Lo schema non certifica da solo una fonte o l’identità di un revisore.

## WebKit e Safari

- [ ] Estendere la suite CI a Playwright WebKit per i target standard e personalizzati.
- [ ] Verificare Safari su macOS e iOS reali: menu, focus/Escape, filtri e URL, link profondi, layout e contenuto senza JavaScript.

Completamento: versioni e dispositivi annotati, risultati riproducibili e regressioni risolte. L’emulazione mobile Chromium attuale non certifica Safari.

## Verifica Aruba e convivenza WordPress

- [ ] Concordare un intervento separatamente autorizzato con backup e inventario; confermare document root e destinazione di anteprima isolate.
- [ ] Verificare HTTPS, link e asset sotto prefisso, URL profondi, canonical, robots effettivo della root e risposta HTTP 404 reale.
- [ ] Verificare interazione con WordPress, precedenza `index.php`/`index.html`, regole di rewrite, cache e rollback senza cancellazioni generiche.

Completamento: evidenze HTTP e percorso verificato, WordPress preservato, piano di migrazione e rollback approvati. Nessun deployment automatico o produzione implicita in questa attività.
