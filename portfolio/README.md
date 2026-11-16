# Portfolio — siti in stile cinematografico

Un solo motore (`engine/`) e un file di configurazione per sito (`siti/<nome>/site.config.js`).
Lo stile è quello del sito "Altura": hero con il nome dietro il soggetto, interfaccia in vetro,
tour guidato dallo scroll con i capitoli che compaiono sfocati.

```
portfolio/
├── index.html              pagina indice con tutti i siti
├── PROMPTS.md              prompt per generare foto hero e video di ogni settore
├── engine/
│   ├── engine.css          stile comune
│   └── engine.js           costruisce la pagina dalla config, hero, tour, animazioni
├── siti/
│   ├── altura/             studio di riferimento (replica dal video, solo uso interno)
│   ├── immobiliare/        Dimora — Villa Corallo
│   ├── ristorante/         Brace — Milano
│   ├── hotel/              Albe — Bellagio
│   └── auto/               Linea — GT Elettrica
└── tools/
    ├── hero_depth.py       foto hero → sfondo + soggetto ritagliato (effetto profondità)
    ├── video_to_frames.py  video → fotogrammi WebP del tour
    ├── build_single.py     sito → pagina unica pubblicabile (CSS/JS/config incorporati)
    └── altura_*.py         script usati per ripulire la registrazione di Altura
```

## Vederli in locale

```bash
cd portfolio
python3 -m http.server 8770
# http://localhost:8770            → indice
# http://localhost:8770/siti/hotel → un sito
```

I siti senza foto e video mostrano lo stesso layout su uno sfondo sfumato, con l'avviso
"in arrivo": così si possono già controllare testi e colori.

## Aggiungere foto e video a un sito

1. Generate foto hero e video seguendo [`PROMPTS.md`](PROMPTS.md).
2. Foto hero → livelli:
   ```bash
   python3 tools/hero_depth.py sorgenti/hero.jpg siti/hotel
   ```
   Controllate `siti/hotel/hero-mask-preview.jpg` (il rosso è il cielo) e incollate il blocco
   `hero` stampato in `site.config.js`.
3. Video → fotogrammi:
   ```bash
   python3 tools/video_to_frames.py sorgenti/tour.mp4 siti/hotel --frames 240
   ```
   Incollate il blocco `frames` in `site.config.js → tour`.
4. Regolate i `range` dei capitoli sulle soste della camera: sono frazioni del tour (0 = inizio,
   1 = fine), nel formato `[entra da, entra fino a, esce da, esce fino a]`.

Dipendenze degli script: `ffmpeg`, `pip install opencv-python-headless numpy pillow`.

## Cosa si cambia nella config

| Chiave | Cosa controlla |
| --- | --- |
| `theme` | colori: cielo, fondo, vetro del menu e dei chip, accento |
| `brand` | nome nel menu e scritta gigante dell'hero |
| `nav`, `cta`, `chips` | menu a pillola, bottone bianco, chip delle categorie |
| `hero` | foto, ritaglio del soggetto, posizione della scritta (`fit` = larghezza / foto) |
| `card` | card "in evidenza" in basso a sinistra |
| `intro` | testo in basso a destra |
| `tour.chapters` | capitoli: allineamento (`left`, `right`, `center`), altezza `y`, testi e `range` |
| `closing`, `footer` | chiusura della pagina |

## Prestazioni (telefono, tablet, Mac/PC)

I fotogrammi non vengono disegnati su un `<canvas>`. Ognuno diventa un'immagine dentro il tour e
il motore rende visibili solo quella sullo schermo e la successiva (per la dissolvenza): il browser
le compone con la scheda grafica e non deve ridisegnare nulla a ogni scroll.

| | Telefono | Tablet | Desktop |
| --- | --- | --- | --- |
| Fotogrammi usati | 1 ogni 2 (con dissolvenza) | 1 ogni 2 (con dissolvenza) | tutti |
| Fotogrammi pronti in memoria | 10 | 14 | 32 (20 con poca RAM) |

Altre regole: i fotogrammi restano compressi finché servono e la pagina non lavora quando non si
scorre. Su Safari e su touch niente parallasse nell'hero: ogni elemento "vetro" dovrebbe
ricalcolare la sfocatura a ogni movimento. Su touch vetro e sfocature sono più leggeri, i
pulsanti hanno un'area di tocco più ampia e sono rispettati notch e barra home.

Con `tour.focus` si sceglie quale parte del filmato resta inquadrata sugli schermi verticali man
mano che si scorre, ad esempio `[[0, 0.5], [0.3, 0.6]]`.

Misure in Chrome emulato con CPU rallentata 4× (mediana del tempo per fotogramma, 16,7 ms = 60 fps):

| | primo motore (canvas) | ora |
| --- | --- | --- |
| iPhone 13 | 50 ms | 16,7 ms |
| iPad Pro 11 | 100 ms | 16,7 ms |
| Mac Retina 1440×900 | 200 ms | 16,7 ms |
| PC 1920×1080 | 83 ms | 16,7 ms |

## Qualità delle immagini

Altura parte dalla registrazione dello schermo di un telefono (circa 1150 px, compressa due
volte), quindi su schermi grandi resta morbida. I fotogrammi sono ripuliti dalla grana
(riduzione del rumore NLM) e la foto hero è ingrandita 2× con una rete neurale (EDSR). Per i siti
del portfolio la nitidezza vera arriva dai video originali in HD o 4K.
