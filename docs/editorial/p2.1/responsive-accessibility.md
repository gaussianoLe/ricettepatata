# Responsive e accessibilità

Sei progetti Chromium dedicati ai viewport 320, 375, 390, 768, 1024 e 1440 px, altezza 960 px. Le tre configurazioni editoriali preesistenti desktop/tablet/mobile conservano tutti i test P1.x/P2.0; nessun test saltato per far passare i nuovi layout. I 12 casi UX aggiuntivi producono 36 casi editoriali totali per configurazione CI.

Per entrambe le ricette: quantità/nome/checkbox, vincoli di cottura, separazione articolo/dossier, testi procedurali esatti, JSON-LD invariato, fallback fotografico contenuto; nessun overflow in modalità normale/cucina; ingredienti e procedimento impilati sotto 960 px e affiancati da desktop; altezza minima 44 px delle label ingredienti e dei controlli di consultazione. I testi possono andare a capo: nessun line clamp o taglio dei titoli.

Axe WCAG 2 A/AA e 2.1 A/AA negli stati normale, dossier espanso e modalità cucina. Test di Enter/Space/focus/ancore, spunte e reset al reload, assenza di storage e pagina consultabile senza JavaScript mantenuti. Le spunte indicano solo consultazione, non sicurezza/approvazione. Nessun mantenimento dello schermo acceso o salvataggio sensibile.

Risultati effettivi e conteggi in validation-evidence.json; l’automazione non dimostra conformità completa. Restano screen reader reali, zoom e preferenze utente su hardware reale, Safari/WebKit, Firefox e prove durante la preparazione effettiva. Nessuna dichiarazione di prova in cucina.
