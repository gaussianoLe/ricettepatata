# Audit dipendenze — questione aperta

Eseguito `npm audit --json` il **2026-11-18**, exit code 1: **11 high**, zero critical. Le segnalazioni si propagano da un unico advisory di picomatch, [GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), relativo a ReDoS su determinati pattern extglob. Versioni presenti: picomatch 4.0.7 e 2.3.2. Il registro npm riporta 4.0.7 come latest; l’advisory, aggiornato il 17 novembre, non indica una versione corretta.

Nessuna correzione viene dichiarata eseguita. Il downgrade major di Astro suggerito automaticamente da npm non è stato applicato: non è una patch verificata per questa architettura. Non sono stati ignorati advisory o modificati i livelli di severità.

Ambito attuale: toolchain Node di build/sviluppo (Astro/Vite/glob), non runtime distribuito su Aruba. I client script sono menu/ricerca/cucina e il pacchetto contiene solo risorse statiche ammesse, nessun Node/npm. I glob usati dal progetto sono costanti; nessuna API consente agli utenti pubblici di fornire pattern. Queste osservazioni limitano l’esposizione nel caso corrente, ma **non dimostrano assenza universale di sfruttabilità** della toolchain.

Richiesta al revisore: valutare questo rischio aperto prima del go-live e verificare una patch upstream quando disponibile. Le build vanno eseguite su sorgenti e configurazioni fidati. CI funzionale verde non significa audit dipendenze pulito. Nessuna pubblicazione è autorizzata da P2.2.
