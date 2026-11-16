# Piano manuale di pubblicazione e rollback — non eseguito

Questo documento non autorizza alcuna promozione o deployment e non introduce comandi di pubblicazione.

1. Ottenere review indipendente della PR P2.0 su SHA preciso; correggere problemi, completare le checklist individuali e acquisire decisione esplicita sulle prove culinarie mancanti.
2. Acquisire o accettare esplicitamente l’assenza degli asset; verificare licenze, alt, formato e implicazioni per SEO. Risolvere etichette/allergeni, accompagnamenti e controlli editoriali effettivi.
3. Solo dopo un’autorizzazione separata, aprire una nuova PR di pubblicazione. Adottare il template nella route Astro pubblica attraverso la policy normale, senza eccezioni per draft; impostare manualmente metadati di review/pubblicazione reali esclusivamente per ciascun record autorizzato. RP-0062 resta escluso finché needs_revision.
4. Registrare hash prima/dopo, decisioni, revisore e date effettive. Non riscrivere gli snapshot storici: aggiungere un nuovo ciclo di verifica che distingua stato storico da corrente e aggiorni consapevolmente i guard di immutabilità che oggi vietano la pubblicazione. Nessun bypass automatico di validazioni P1.x o upsert.
5. Eseguire catalogo, editoriale, Node/browser, accessibilità, quattro configurazioni, audit e riproducibilità sulla nuova PR; verificare URL, canonical, sitemap, ricerca e dati strutturati. Richiedere nuova review e approvazione esplicita al merge.
6. Deployment solo con ulteriore mandato esplicito: piano Aruba separato, inventario e backup autorizzati, protezione WordPress e verifica degli artefatti. P2.0 non modifica file remoti.

Rollback eventuale: preservare SHA/artefatto e manifest dell’ultima versione pubblica autorizzata. Preparare una PR di revert mirata che ripristini template/metadati e i file esatti precedenti, senza cambiare UUID/slug o cancellare registro e dossier; gestire eventuali URL già indicizzati con decisione esplicita, non inventare redirect. Rieseguire gli audit e ottenere approvazione al merge/deployment del rollback. Nessun ripristino remoto automatico; WordPress resta fuori ambito.
