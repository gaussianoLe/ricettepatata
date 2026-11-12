# Area di lavorazione editoriale

I dossier e i record di quest’area sono separati dalle Astro Content Collections. Nessun loader importa questi file. La prima lavorazione è descritta in [first-ten/README.md](first-ten/README.md); la [matrice delle fonti](first-ten/source-matrix.md) collega ogni affermazione ai riscontri e segnala ciò che resta irrisolto.

Il [consolidamento P1.4](p1.4/README.md) mantiene gli artefatti P1.3 immutabili e aggiunge dossier versionati, proposte manuali di arricchimento e controlli ripetibili. `npm run editorial:consolidation` non applica né pubblica dati.

[P1.5 integra i tre draft nel catalogo operativo](../integration/p1.5/README.md), mantenendoli privati in entrambi i target e preservando gli artefatti storici. I controlli P1.3/P1.4 verificano la baseline; `integration:check` controlla le tre aggiunte correnti e i demo invariati.
