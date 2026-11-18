# Ricerca fotografica e stato delle licenze

Consultazione fotografica effettiva: **2026-11-17**. Nessuna immagine generata o hotlink remota nell’HTML.

## Papas — integrata

[Fonte Commons: Papasarrugadas.jpg](https://commons.wikimedia.org/wiki/File:Papasarrugadas.jpg), autore attribuito **Fer..**, originale da Flickr, con revisione FlickreviewR del 7 aprile 2007. La scheda dichiara **CC BY 2.0**. Il [deed Creative Commons](https://creativecommons.org/licenses/by/2.0/) consultato consente uso commerciale e adattamenti, con credito, link alla licenza e indicazione delle modifiche. Il collegamento Flickr originario non era accessibile al tool di ricerca: non viene dichiarato consultato. La base documentale adottata è la scheda Commons con revisione della licenza.

Originale scaricato soltanto dopo questa verifica; SHA-256, URL, dimensioni 1280×960, autore, licenza, alt e nota illustrativa sono in `release/photos.json`. Ispezione visiva: patate intere con buccia, salsa rossa e piatto bianco, coerenti con papas e mojo; non è presentata come prova in cucina della formula della redazione.

La build isolata genera **480/800/1280 px in AVIF, WebP e JPEG**, più JPEG social 1200×630. L’hero usa picture/srcset/sizes, dimensioni esplicite, decoding async e fetchpriority high; le immagini secondarie del catalogo usano lazy loading e credito visibile. Conversione/ridimensionamento, crop social e inquadratura responsive delle anteprime sono dichiarati nel manifest. Credito e licenza sono visibili nella pagina e nel file media/ATTRIBUTION.txt. Le varianti non vengono salvate in public o dist del checkout ordinario.

## Gattò — placeholder, blocco aperto

Esaminate [Gattò di patate.jpg](https://commons.wikimedia.org/wiki/File:Gatt%C3%B2_di_patate.jpg) e [Gattò di patate 2.jpg](https://commons.wikimedia.org/wiki/File:Gatt%C3%B2_di_patate_2.jpg). Entrambe attribuiscono Stefania Curci, dichiarano CC BY-SA 4.0 e indicano WhatsApp come origine; il rapporto fra caricatore e titolare non è sufficientemente chiaro per la selezione di questa release. Nessuna delle due è stata scaricata o incorporata.

Serve una foto originale autorizzata o una provenienza/licenza più solida. La pipeline supporta entrambe le ricette tramite il manifest: per una futura foto autorizzata servono file locale in release/assets, SHA, autore, URL fonte/licenza, consenso commerciale/adattamenti, alt, caption e dimensioni reali (almeno 1280 px di larghezza per le varianti previste). Nessuna nuova implementazione della pagina necessaria. L’inserimento richiede review dei diritti; i flag del manifest non sostituiscono la verifica umana della licenza.

Se l’utente accetta espressamente il placeholder, può rimanere senza foto: non inventare og:image/image e non dichiarare idoneità ai rich result Recipe per il Gattò.
