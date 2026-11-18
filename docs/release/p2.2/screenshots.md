# Screenshot e review del prodotto

Dalla root del checkout: `npm run release:build`. Aprire i due URL localhost stampati. Il server rimane confinato a 127.0.0.1:4323, senza pubblicazione internet. Per una verifica manuale impostare DevTools a 390×844 e 1440×1000 e acquisire screenshot full-page; controllare anche 320/375/768/1024 e la modalità cucina. Salvare solo in una directory temporanea esterna, non in public/dist/test-results del repository. Ctrl+C cancella il sito RC; nessuna immagine privata viene caricata in CI.

La consegna include screenshot locali delle due pagine a desktop/mobile; i percorsi temporanei o il comando per rigenerarli sono riportati nella PR. Verificare navigazione home → catalogo → ricetta, ricerca “mojo”, filtro Italia, reset, breadcrumb, correlate, crediti fotografici Papas e placeholder Gattò. Aprire menu da tastiera e provare le spunte senza interpretarle come approvazione o prova in cucina.

Restano Safari/WebKit, Firefox, screen reader e hardware reali. I test axe/Chromium non dimostrano conformità completa né prestazioni Core Web Vitals certificate.
